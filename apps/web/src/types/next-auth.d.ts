import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    interface User {
        role?: string;
        customerId?: string;
        accessToken?: string;
        refreshToken?: string;
    }

    interface Session {
        user: User & {
            id: string;
            role?: string;
            customerId?: string;
            accessToken?: string;
            refreshToken?: string;
            error?: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        uuid?: string;
        role?: string;
        customerId?: string;
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
        error?: string;
    }
}
