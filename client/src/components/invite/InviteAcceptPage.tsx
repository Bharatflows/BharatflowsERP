/**
 * Invite Accept Page
 * Handles both employee and party invite acceptance flows
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Building2, User, Lock, Phone, Mail, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { inviteService, Invite } from '../../services/modules.service';

export function InviteAcceptPage() {
    const { type, token } = useParams<{ type: string; token: string }>();
    const navigate = useNavigate();

    const [invite, setInvite] = useState<Invite | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        gstin: '',
    });

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('Invalid invite link');
                setLoading(false);
                return;
            }

            try {
                const response = await inviteService.verifyInvite(token);
                if (response.success && response.data) {
                    setInvite(response.data);
                    // Pre-fill email from invite
                    setFormData(prev => ({ ...prev, email: response.data?.email || '' }));
                } else {
                    setError(response.message || 'Invalid invite');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to verify invite');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!invite || !token) return;

        // Validation
        if (!formData.name.trim()) {
            toast.error('Please enter your name');
            return;
        }
        if (!formData.password || formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (invite.type === 'PARTY' && !formData.businessName.trim()) {
            toast.error('Please enter your business name');
            return;
        }

        setSubmitting(true);

        try {
            if (invite.type === 'EMPLOYEE') {
                const response = await inviteService.acceptEmployeeInvite({
                    token,
                    name: formData.name,
                    phone: formData.phone || undefined,
                    password: formData.password,
                });
                if (response.success) {
                    toast.success('Account created successfully!');
                    navigate('/login', { state: { email: response.data?.email } });
                } else {
                    toast.error(response.message || 'Failed to create account');
                }
            } else {
                const response = await inviteService.acceptPartyInvite({
                    token,
                    name: formData.name,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    password: formData.password,
                    businessName: formData.businessName,
                    gstin: formData.gstin || undefined,
                });
                if (response.success) {
                    toast.success('Company account created successfully!');
                    navigate('/login', { state: { email: response.data?.email } });
                } else {
                    toast.error(response.message || 'Failed to create account');
                }
            }
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                    <p className="text-muted-foreground">Verifying invite...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                            <h2 className="text-xl font-semibold">Invalid Invite</h2>
                            <p className="text-muted-foreground">{error}</p>
                            <Link to="/login">
                                <Button variant="outline">Go to Login</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!invite) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    {invite.company?.logo ? (
                        <img src={invite.company.logo} alt="Company Logo" className="h-16 w-16 mx-auto rounded-full mb-4" />
                    ) : (
                        <div className="h-16 w-16 mx-auto rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                            <Building2 className="h-8 w-8 text-purple-600" />
                        </div>
                    )}
                    <CardTitle className="text-2xl">
                        {invite.type === 'EMPLOYEE'
                            ? `Join ${invite.company?.businessName || 'the team'}`
                            : 'Create Your Account'
                        }
                    </CardTitle>
                    <CardDescription>
                        {invite.type === 'EMPLOYEE' ? (
                            <>You've been invited to join as <Badge variant="secondary">{invite.role || 'Team Member'}</Badge></>
                        ) : (
                            <>Create your business account on BharatFlow</>
                        )}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email (readonly for employee, editable for party) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@example.com"
                                    className="pl-10"
                                    readOnly={invite.type === 'EMPLOYEE'}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Business fields for party invite */}
                        {invite.type === 'PARTY' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Business Name *</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="businessName"
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleChange}
                                            placeholder="Your Business Name"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gstin">GSTIN (Optional)</Label>
                                    <Input
                                        id="gstin"
                                        name="gstin"
                                        value={formData.gstin}
                                        onChange={handleChange}
                                        placeholder="22AAAAA0000A1Z5"
                                    />
                                </div>
                            </>
                        )}

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a password"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Module Access Preview for Employee */}
                        {invite.type === 'EMPLOYEE' && invite.moduleAccess && Object.keys(invite.moduleAccess).length > 0 && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">Access will be granted to:</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(invite.moduleAccess)
                                        .filter(([_, enabled]) => enabled)
                                        .map(([module]) => (
                                            <Badge key={module} variant="outline" className="capitalize">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                {module}
                                            </Badge>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Invite message */}
                        {invite.message && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-900">
                                <p className="text-sm text-blue-700 dark:text-blue-300">"{invite.message}"</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-600 hover:underline">
                            Log in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default InviteAcceptPage;
