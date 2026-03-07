import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms'; // if you have ms installed 

const secret: string = process.env.JWT_SECRET!; // The '!' tells TS this is not undefined

export const generateToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN as StringValue|| '7d'
  };
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  } else{
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: options.expiresIn }
    );
  }
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
