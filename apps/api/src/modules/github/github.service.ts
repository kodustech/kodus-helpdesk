import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class GitHubService {
    private readonly logger = new Logger(GitHubService.name);
    private readonly client: AxiosInstance | null;
    private readonly organization: string;
    private readonly projectNumber: number;
    private readonly repository: string;

    constructor(private readonly configService: ConfigService) {
        const token = this.configService.get<string>('GITHUB_TOKEN');

        this.organization = this.configService.get<string>(
            'GITHUB_ORG',
            'kodustech',
        );
        this.projectNumber = parseInt(
            this.configService.get<string>('GITHUB_PROJECT_NUMBER') || '1',
            10,
        );
        this.repository = this.configService.get<string>(
            'GITHUB_REPOSITORY',
            'kodus-ai',
        );

        if (!token) {
            this.logger.warn(
                'GITHUB_TOKEN not configured. GitHub integration will be disabled.',
            );
            this.client = null;
        } else {
            this.client = axios.create({
                baseURL: 'https://api.github.com',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            });
        }
    }

    private isEnabled(): boolean {
        return this.client !== null;
    }

    async createIssueAndAddToProject(
        title: string,
        category: string,
    ): Promise<{
        issueUrl: string;
        issueNumber: number;
        projectItemId?: string;
    }> {
        if (!this.isEnabled()) {
            const errorMessage = 'GitHub integration is disabled. Cannot create issue.';
            this.logger.warn(errorMessage);
            throw new Error(errorMessage);
        }

        try {
            const label =
                category.charAt(0).toUpperCase() +
                category.slice(1).toLowerCase();

            await this.ensureLabelExists(label);

            const issueResponse = await this.client.post(
                `/repos/${this.organization}/${this.repository}/issues`,
                {
                    title,
                    labels: [label],
                },
            );

            const issueUrl = issueResponse.data.html_url;
            const issueNumber = issueResponse.data.number;

            this.logger.log(`Issue created: ${issueUrl}`);

            const projectItemId = await this.addIssueToProject(issueNumber);

            return { issueUrl, issueNumber, projectItemId };
        } catch (error) {
            this.logger.error(`Failed to create issue: ${error.message}`);
            throw error;
        }
    }

    private async ensureLabelExists(label: string): Promise<void> {
        try {
            await this.client.post(
                `/repos/${this.organization}/${this.repository}/labels`,
                {
                    name: label,
                    color: this.getLabelColor(label),
                    description: `${label} category from helpdesk`,
                },
            );
            this.logger.log(`Label '${label}' created`);
        } catch (error: any) {
            if (error.response?.status === 422) {
                this.logger.log(`Label '${label}' already exists`);
            } else {
                this.logger.warn(`Failed to create label: ${error.message}`);
            }
        }
    }

    private getLabelColor(label: string): string {
        const colors: Record<string, string> = {
            Bug: 'ff0000',
            Feature: '1d76db',
            Improvement: '0e8a16',
        };
        return colors[label] || 'ededed';
    }

    private async addIssueToProject(
        issueNumber: number,
    ): Promise<string | undefined> {
        try {
            this.logger.log(
                `Getting project ID for org=${this.organization}, number=${this.projectNumber}`,
            );
            const projectId = await this.getProjectId();
            this.logger.log(`Project ID: ${projectId}`);

            const contentId = await this.getIssueContentId(issueNumber);
            this.logger.log(`Issue content ID: ${contentId}`);

            const columnId = await this.getColumnId(projectId, 'Up Next');
            this.logger.log(`Column ID for 'Up Next': ${columnId}`);

            const response = await this.client.post(
                'https://api.github.com/graphql',
                {
                    query: `
                        mutation addItem($projectId: ID!, $contentId: ID!) {
                            addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
                                item {
                                    id
                                }
                            }
                        }
                    `,
                    variables: {
                        projectId,
                        contentId,
                    },
                },
            );

            this.logger.log(
                `GraphQL response: ${JSON.stringify(response.data)}`,
            );

            if (response.data.errors) {
                this.logger.warn(
                    `GraphQL errors: ${JSON.stringify(response.data.errors)}`,
                );
                return undefined;
            }

            const itemId = response.data.data?.addProjectV2ItemById?.item?.id;
            this.logger.log(`Issue added to project: ${itemId}`);

            if (itemId && columnId) {
                await this.moveItemToColumn(projectId, itemId, columnId);
            }

            return itemId;
        } catch (error) {
            this.logger.warn(
                `Failed to add issue to project: ${error.message}`,
            );
            return undefined;
        }
    }

    private async getColumnId(
        projectId: string,
        columnName: string,
    ): Promise<string | undefined> {
        try {
            const response = await this.client.post(
                'https://api.github.com/graphql',
                {
                    query: `
                        query($projectId: ID!) {
                            node(id: $projectId) {
                                ... on ProjectV2 {
                                    fields(first: 50) {
                                        nodes {
                                            ... on ProjectV2SingleSelectField {
                                                id
                                                name
                                                options {
                                                    id
                                                    name
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `,
                    variables: {
                        projectId,
                    },
                },
            );

            const fields = response.data.data.node.fields.nodes;
            const statusField = fields.find(
                (f: any) => f.name === 'Status' || f.name === 'Status',
            );

            if (statusField?.options) {
                const option = statusField.options.find(
                    (o: any) =>
                        o.name.toLowerCase() === columnName.toLowerCase(),
                );
                if (option) {
                    return option.id;
                }
            }

            return undefined;
        } catch (error) {
            this.logger.warn(`Failed to get column ID: ${error.message}`);
            return undefined;
        }
    }

    private async moveItemToColumn(
        projectId: string,
        itemId: string,
        columnId: string,
    ): Promise<void> {
        try {
            const statusFieldId = await this.getStatusFieldId(projectId);
            if (!statusFieldId) {
                this.logger.warn('Could not find Status field ID');
                return;
            }

            const response = await this.client.post(
                'https://api.github.com/graphql',
                {
                    query: `
                        mutation updateItem($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
                            updateProjectV2ItemFieldValue(input: {
                                projectId: $projectId
                                itemId: $itemId
                                fieldId: $fieldId
                                value: { singleSelectOptionId: $optionId }
                            }) {
                                projectV2Item {
                                    id
                                }
                            }
                        }
                    `,
                    variables: {
                        projectId,
                        itemId,
                        fieldId: statusFieldId,
                        optionId: columnId,
                    },
                },
            );

            if (response.data.errors) {
                this.logger.warn(
                    `Failed to move item to column: ${JSON.stringify(
                        response.data.errors,
                    )}`,
                );
            } else {
                this.logger.log(`Item moved to column successfully`);
            }
        } catch (error) {
            this.logger.warn(`Failed to move item to column: ${error.message}`);
        }
    }

    private async getStatusFieldId(
        projectId: string,
    ): Promise<string | undefined> {
        try {
            const response = await this.client.post(
                'https://api.github.com/graphql',
                {
                    query: `
                        query($projectId: ID!) {
                            node(id: $projectId) {
                                ... on ProjectV2 {
                                    fields(first: 50) {
                                        nodes {
                                            ... on ProjectV2SingleSelectField {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `,
                    variables: {
                        projectId,
                    },
                },
            );

            const fields = response.data.data.node.fields.nodes;
            const statusField = fields.find((f: any) => f.name === 'Status');

            return statusField?.id;
        } catch (error) {
            this.logger.warn(`Failed to get Status field ID: ${error.message}`);
            return undefined;
        }
    }

    private async getProjectId(): Promise<string> {
        try {
            const response = await this.client.post(
                'https://api.github.com/graphql',
                {
                    query: `
                        query($org: String!, $projectNumber: Int!) {
                            organization(login: $org) {
                                projectV2(number: $projectNumber) {
                                    id
                                }
                            }
                        }
                    `,
                    variables: {
                        org: this.organization,
                        projectNumber: this.projectNumber,
                    },
                },
            );

            if (response.data.errors) {
                this.logger.warn(
                    `GraphQL errors: ${JSON.stringify(response.data.errors)}`,
                );
                throw new Error(
                    response.data.errors[0]?.message || 'GraphQL error',
                );
            }

            return response.data.data.organization.projectV2.id;
        } catch (error) {
            this.logger.error(`Failed to get project ID: ${error.message}`);
            throw error;
        }
    }

    private async getIssueContentId(issueNumber: number): Promise<string> {
        const response = await this.client.get(
            `/repos/${this.organization}/${this.repository}/issues/${issueNumber}`,
        );
        return response.data.node_id;
    }
}
