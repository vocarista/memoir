import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import pool from '../../../../lib/db';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }: any) {
      let connection;
      try {
        connection = await pool.connect();

        // Check if user exists in the database
        const { rows: existingUsers } = await connection.query(
          'SELECT * FROM users WHERE email = $1',
          [user.email]
        );

        if (existingUsers.length === 0) {
          // Insert new user into the database
          await connection.query(
            'INSERT INTO users (email, name) VALUES ($1, $2)',
            [user.email, user.name]
          );
        }

        return user;
      } catch (error) {
        console.error('Database query error in signIn callback:', error);
        return false; 
      } finally {
        if (connection) {
          connection.release();
        }
      }
    },
  },
};

export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
