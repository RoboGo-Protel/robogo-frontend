/* eslint-disable @typescript-eslint/no-explicit-any */
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('Redirect callback:', { url, baseUrl });

      // If URL is relative, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // If URL is on the same domain, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default to base URL
      return baseUrl;
    },
    async signIn({ user, account }: { user: any; account: any }) {
      console.log('SignIn callback triggered:', { user, account });

      if (account?.provider === 'google') {
        console.log('Google provider detected, proceeding with auth...');
        try {
          const baseUrl =
            process.env.NEXTAUTH_URL ||
            (typeof window !== 'undefined'
              ? window.location.origin
              : 'https://robogo.website');
          console.log('Calling Google auth API:', `${baseUrl}/api/auth/google`);

          const response = await fetch(`${baseUrl}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              googleId: user.id,
              picture: user.image,
            }),
          });

          console.log('Google auth API response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('Google auth API response data:', data);

            user.accessToken = data.token;
            user.backendUser = data.user;

            console.log(
              'SignIn callback returning TRUE - authentication successful',
            );
            return true;
          } else {
            const errorData = await response.json();
            console.error('Google auth API error:', errorData);
            console.log(
              'SignIn callback returning FALSE - authentication failed',
            );
            return false;
          }
        } catch (error) {
          console.error('Google sign-in error:', error);
          console.log('SignIn callback returning FALSE - error occurred');
          return false;
        }
      }
      console.log('SignIn callback returning FALSE - not Google provider');
      return false;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      console.log('JWT callback triggered:', { token, user });
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
        token.backendUser = user.backendUser;
        console.log('Storing accessToken in JWT token:', !!token.accessToken);
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log('Session callback triggered:', { session, token });
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
        session.user = token.backendUser || session.user;
        console.log('Session contains accessToken:', !!session.accessToken);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
