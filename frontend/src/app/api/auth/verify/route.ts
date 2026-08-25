import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 400 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'This account is already verified' },
        { status: 400 }
      );
    }

    // Check code and expiration
    const isCodeValid = user.verificationToken === otp;
    const isCodeNotExpired = user.verificationTokenExpires && new Date(user.verificationTokenExpires) > new Date();

    if (!isCodeValid || !isCodeNotExpired) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Automatically log user in upon successful verification
    const token = signToken(user._id.toString());

    const response = NextResponse.json({
      success: true,
      message: 'Email address verified successfully. Logging in...',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60, // 60 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[VERIFY API ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
