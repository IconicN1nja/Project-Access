import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email, password, resend } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Handle resending verification OTP email
    if (resend) {
      if (user.isVerified) {
        return NextResponse.json({ error: 'This account is already verified' }, { status: 400 });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.verificationToken = otp;
      user.verificationTokenExpires = tokenExpires;
      await user.save();

      const mailResult = await sendOtpEmail(email, otp);

      return NextResponse.json({
        success: true,
        message: 'A new verification code has been sent to your email.',
        loggedToConsole: mailResult.loggedToConsole || false,
      });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if verified
    if (!user.isVerified) {
      // If unverified, generate a new OTP and send it immediately so they can verify on the next screen
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.verificationToken = otp;
      user.verificationTokenExpires = tokenExpires;
      await user.save();

      await sendOtpEmail(email, otp);

      return NextResponse.json(
        {
          error: 'Your email address is not verified. A verification code has been sent.',
          unverified: true,
        },
        { status: 403 }
      );
    }

    // Generate token
    const token = signToken(user._id.toString());

    // Create response
    const response = NextResponse.json({
      success: true,
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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[LOGIN API ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
