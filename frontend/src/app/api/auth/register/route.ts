import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    // Generate 6-digit OTP and expiration (10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: 'An account with this email address already exists' },
          { status: 400 }
        );
      }

      // User exists but is unverified, update details and send new OTP
      const hashedPassword = await bcrypt.hash(password, 10);

      existingUser.password = hashedPassword;
      existingUser.name = name || existingUser.name;
      existingUser.verificationToken = otp;
      existingUser.verificationTokenExpires = tokenExpires;
      await existingUser.save();

      const mailResult = await sendOtpEmail(email, otp);

      return NextResponse.json({
        success: true,
        message: 'Registration updated. A verification code has been sent to your email.',
        loggedToConsole: mailResult.loggedToConsole || false,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      isVerified: false,
      verificationToken: otp,
      verificationTokenExpires: tokenExpires,
    });

    await newUser.save();

    const mailResult = await sendOtpEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: 'Account created. Please check your email for the verification code.',
      loggedToConsole: mailResult.loggedToConsole || false,
    });
  } catch (error: any) {
    console.error('[REGISTER API ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
