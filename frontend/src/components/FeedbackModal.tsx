import React, { useState } from 'react';
import { X, Send, MessageSquare, AlertCircle, Lightbulb, RefreshCcw } from 'lucide-react';
import { submitFeedback } from '../api/client';
import './FeedbackModal.css';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FeedbackCategory = 'Feedback' | 'Complaints' | 'Feature Request';

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [category, setCategory] = useState<FeedbackCategory>('Feedback');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        setError('');
        try {
            await submitFeedback(category, message);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset after closing
                setIsSuccess(false);
                setMessage('');
                setCategory('Feedback');
            }, 2500);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to send feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="feedback-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose} aria-label="Close">
                    <X size={20} />
                </button>

                {isSuccess ? (
                    <div className="success-state text-center">
                        <div className="success-icon-wrapper">
                            <Send size={48} className="text-success" />
                        </div>
                        <h2>Thank You!</h2>
                        <p>Your {category.toLowerCase()} has been sent to our team.</p>
                    </div>
                ) : (
                    <>
                        <div className="modal-header">
                            <MessageSquare size={24} className="text-primary" />
                            <h2>Send Feedback</h2>
                        </div>
                        <p className="modal-subtitle">We'd love to hear your thoughts on TrackyJobby.</p>

                        <form onSubmit={handleSubmit}>
                            <div className="category-selector">
                                <label>What's on your mind?</label>
                                <div className="category-grid">
                                    <button
                                        type="button"
                                        className={`category-btn ${category === 'Feedback' ? 'active' : ''}`}
                                        onClick={() => setCategory('Feedback')}
                                    >
                                        <MessageSquare size={16} />
                                        <span>Feedback</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`category-btn ${category === 'Complaints' ? 'active' : ''}`}
                                        onClick={() => setCategory('Complaints')}
                                    >
                                        <AlertCircle size={16} />
                                        <span>Complaints</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`category-btn ${category === 'Feature Request' ? 'active' : ''}`}
                                        onClick={() => setCategory('Feature Request')}
                                    >
                                        <Lightbulb size={16} />
                                        <span>Feature Request</span>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="feedback-message">Details</label>
                                <textarea
                                    id="feedback-message"
                                    placeholder={`Write your ${category.toLowerCase()} here...`}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={5}
                                    required
                                />
                            </div>

                            {error && <div className="error-text text-danger mb-4">{error}</div>}

                            <button
                                type="submit"
                                className="submit-feedback-btn"
                                disabled={isSubmitting || !message.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCcw size={18} className="spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Send Submission</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
