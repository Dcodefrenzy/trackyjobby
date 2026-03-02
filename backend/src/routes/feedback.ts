import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendFeedbackEmail } from '../utils/email';

const router = Router();

/**
 * POST /api/feedback
 * Submit user feedback, complaints, or feature requests.
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    console.log(`📝 [DEBUG] Feedback route reached. User ID: ${req.userId}`);
    try {
        const { category, message } = req.body;
        console.log(`📝 [DEBUG] Feedback body:`, { category, message });

        if (!category || !message) {
            console.log(`📝 [DEBUG] Validation failed: Category or message missing.`);
            return res.status(400).json({ error: 'Category and message are required' });
        }

        // 1. Fetch user details for richer email/logging
        console.log(`📝 [DEBUG] Fetching user details...`);
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', req.userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Save to database
        const { error: dbError } = await supabase
            .from('feedback')
            .insert({
                user_id: req.userId,
                category,
                message,
                created_at: new Date().toISOString()
            });

        if (dbError) {
            console.error('❌ Error saving feedback to database:', dbError);
            // We continue anyway to try and send the email
        }

        // 3. Send email to admin
        try {
            await sendFeedbackEmail(category, message, user.email, user.name);
        } catch (emailErr) {
            console.error('❌ Error sending feedback email:', emailErr);
            // We don't fail the request if email fails but DB saved
        }

        return res.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (err) {
        console.error('❌ Unexpected error in feedback route:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
