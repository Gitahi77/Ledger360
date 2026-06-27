import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import * as argon2 from '@node-rs/argon2';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

import { z } from 'zod';

// Request password reset (Generates token and logs to console)



