import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Plus, Trash2, Shield, Loader2, Edit, Smartphone, Building, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethod {
    id?: string;
    user_id: string;
    type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'bnpl';
    provider: 'phonepe'; // Only PhonePe gateway
    last_four?: string;
    brand?: string; // 'visa', 'mastercard', etc.
    cardholder_name?: string;
    expiry_month?: number;
    expiry_year?: number;
    is_default: boolean;
    is_verified: boolean;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

interface PaymentMethodsManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const PHONEPE_PAYMENT_TYPES = [
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'netbanking', label: 'Net Banking', icon: Building },
    { value: 'wallet', label: 'Digital Wallet', icon: Wallet },
    { value: 'bnpl', label: 'Buy Now Pay Later', icon: CreditCard }
];

const CARD_BRANDS = [
    'visa', 'mastercard', 'amex', 'discover', 'rupay'
];

export const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    // Form state for adding/editing payment methods
    const [formData, setFormData] = useState({
        type: 'card' as PaymentMethod['type'],
        cardholder_name: '',
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        upi_id: '',
        wallet_provider: '',
        bank_account: ''
    });

    useEffect(() => {
        if (isOpen && user) {
            loadPaymentMethods();
        }
    }, [isOpen, user]);

    const loadPaymentMethods = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_payment_methods_safe')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPaymentMethods(data || []);
        } catch (error) {
            console.error('Error loading payment methods:', error);
            toast({
                title: 'Error',
                description: 'Failed to load payment methods',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddPaymentMethod = async () => {
        if (!user) return;

        setSaving(true);
        try {
            // Validate form data
            if (formData.type === 'card' && (!formData.card_number || !formData.cardholder_name)) {
                throw new Error('Please fill in all required card fields');
            }

            if (formData.type === 'upi' && !formData.upi_id) {
                throw new Error('Please enter a valid UPI ID');
            }

            // In a real implementation, you would:
            // 1. Tokenize the payment method with your payment processor (PhonePe/Razorpay/Stripe)
            // 2. Store the token, not the actual card details
            // 3. Verify the payment method

            const newPaymentMethod: PaymentMethod = {
                user_id: user.id,
                type: formData.type,
                provider: 'phonepe',
                ...(formData.type === 'card' && {
                    last_four: formData.card_number.slice(-4),
                    brand: detectCardBrand(formData.card_number),
                    cardholder_name: formData.cardholder_name,
                    expiry_month: parseInt(formData.expiry_month),
                    expiry_year: parseInt(formData.expiry_year)
                }),
                ...(formData.type === 'upi' && {
                    metadata: { upi_id: formData.upi_id }
                }),
                ...(formData.type === 'wallet' && {
                    metadata: { wallet_provider: formData.wallet_provider }
                }),
                ...(formData.type === 'netbanking' && {
                    metadata: { bank_account: formData.bank_account }
                }),
                is_default: paymentMethods.length === 0, // First payment method becomes default
                is_verified: false, // Would be verified by PhonePe
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('user_payment_methods')
                .insert(newPaymentMethod)
                .select()
                .single();

            if (error) throw error;
            setPaymentMethods(prev => [data, ...prev]);

            setShowAddForm(false);
            resetForm();

            toast({
                title: 'Payment Method Added',
                description: 'Your payment method has been saved successfully.',
            });

        } catch (error: any) {
            console.error('Error adding payment method:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to add payment method',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const detectCardBrand = (cardNumber: string): string => {
        const cleaned = cardNumber.replace(/\D/g, '');
        if (cleaned.startsWith('4')) return 'visa';
        if (cleaned.startsWith('5')) return 'mastercard';
        if (cleaned.startsWith('3')) return 'amex';
        if (cleaned.startsWith('6')) return 'discover';
        if (cleaned.startsWith('508') || cleaned.startsWith('607')) return 'rupay';
        return 'unknown';
    };

    const setAsDefault = async (methodId: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('user_payment_methods')
                .update({ is_default: true })
                .eq('id', methodId)
                .eq('user_id', user!.id);

            if (error) throw error;

            setPaymentMethods(prev => prev.map(method => ({
                ...method,
                is_default: method.id === methodId
            })));

            toast({
                title: 'Default Payment Updated',
                description: 'Your default payment method has been updated.',
            });
        } catch (error) {
            console.error('Error setting default payment method:', error);
            toast({
                title: 'Error',
                description: 'Failed to update default payment method',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const deletePaymentMethod = async (methodId: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('user_payment_methods')
                .update({ is_active: false })
                .eq('id', methodId)
                .eq('user_id', user!.id);

            if (error) throw error;

            setPaymentMethods(prev => prev.filter(method => method.id !== methodId));

            toast({
                title: 'Payment Method Deleted',
                description: 'Your payment method has been removed.',
            });
        } catch (error) {
            console.error('Error deleting payment method:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete payment method',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'card',
            cardholder_name: '',
            card_number: '',
            expiry_month: '',
            expiry_year: '',
            cvv: '',
            upi_id: '',
            wallet_provider: '',
            bank_account: ''
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Payment Methods
                    </CardTitle>
                    <CardDescription>
                        Manage your saved payment methods for faster checkout
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Existing Payment Methods */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Your Payment Methods</h3>
                                    <Button
                                        onClick={() => setShowAddForm(true)}
                                        size="sm"
                                        className="flex items-center"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add New
                                    </Button>
                                </div>

                                {paymentMethods.length === 0 ? (
                                    <Card className="border-dashed border-2 border-gray-200">
                                        <CardContent className="flex flex-col items-center justify-center py-8">
                                            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                                            <p className="text-gray-500 text-center">
                                                No payment methods saved yet.
                                                <br />
                                                Add one to make checkout faster.
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid gap-4">
                                        {paymentMethods.map((method) => (
                                            <Card key={method.id} className={`border ${method.is_default ? 'border-primary' : 'border-gray-200'}`}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <CreditCard className="h-6 w-6 text-gray-500" />
                                                            <div>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="font-medium">
                                                                        {method.type === 'card'
                                                                            ? `${method.brand?.toUpperCase()} ending in ${method.last_four}`
                                                                            : method.type.toUpperCase()
                                                                        }
                                                                    </span>
                                                                    {method.is_default && (
                                                                        <Badge variant="default" className="text-xs">Default</Badge>
                                                                    )}
                                                                    {method.is_verified ? (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            <Shield className="h-3 w-3 mr-1" />
                                                                            Verified
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-xs">Pending</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500">
                                                                    {method.type === 'card' && method.cardholder_name}
                                                                    {method.type === 'upi' && method.metadata?.upi_id}
                                                                    {method.type === 'wallet' && `${method.metadata?.wallet_provider} Wallet`}
                                                                    {method.type === 'netbanking' && `${method.metadata?.bank_account} Net Banking`}
                                                                    {method.type === 'bnpl' && 'Buy Now Pay Later'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {!method.is_default && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setAsDefault(method.id!)}
                                                                    disabled={saving}
                                                                >
                                                                    Set Default
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deletePaymentMethod(method.id!)}
                                                                disabled={saving}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Payment Method Form */}
                            {showAddForm && (
                                <Card className="border-primary">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Add New Payment Method</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="type">Payment Type (PhonePe Gateway)</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(value: PaymentMethod['type']) =>
                                                    setFormData(prev => ({ ...prev, type: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PHONEPE_PAYMENT_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-gray-500 mt-1">All payments are processed securely through PhonePe</p>
                                        </div>

                                        {/* Card Fields */}
                                        {formData.type === 'card' && (
                                            <>
                                                <div>
                                                    <Label htmlFor="cardholder_name">Cardholder Name</Label>
                                                    <Input
                                                        id="cardholder_name"
                                                        value={formData.cardholder_name}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, cardholder_name: e.target.value }))}
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="card_number">Card Number</Label>
                                                    <Input
                                                        id="card_number"
                                                        value={formData.card_number}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value.replace(/\D/g, '') }))}
                                                        placeholder="1234 5678 9012 3456"
                                                        maxLength={16}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <Label htmlFor="expiry_month">Month</Label>
                                                        <Select
                                                            value={formData.expiry_month}
                                                            onValueChange={(value) => setFormData(prev => ({ ...prev, expiry_month: value }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="MM" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 12 }, (_, i) => (
                                                                    <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                                                                        {(i + 1).toString().padStart(2, '0')}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="expiry_year">Year</Label>
                                                        <Select
                                                            value={formData.expiry_year}
                                                            onValueChange={(value) => setFormData(prev => ({ ...prev, expiry_year: value }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="YYYY" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 10 }, (_, i) => (
                                                                    <SelectItem key={i} value={(new Date().getFullYear() + i).toString()}>
                                                                        {new Date().getFullYear() + i}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="cvv">CVV</Label>
                                                        <Input
                                                            id="cvv"
                                                            value={formData.cvv}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                                                            placeholder="123"
                                                            maxLength={4}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* UPI Fields */}
                                        {formData.type === 'upi' && (
                                            <div>
                                                <Label htmlFor="upi_id">UPI ID</Label>
                                                <Input
                                                    id="upi_id"
                                                    value={formData.upi_id}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, upi_id: e.target.value }))}
                                                    placeholder="user@upi"
                                                />
                                            </div>
                                        )}

                                        {/* Wallet Fields */}
                                        {formData.type === 'wallet' && (
                                            <div>
                                                <Label htmlFor="wallet_provider">Wallet Provider</Label>
                                                <Select
                                                    value={formData.wallet_provider}
                                                    onValueChange={(value) => setFormData(prev => ({ ...prev, wallet_provider: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select wallet" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="phonepe_wallet">PhonePe Wallet</SelectItem>
                                                        <SelectItem value="paytm">Paytm</SelectItem>
                                                        <SelectItem value="amazon_pay">Amazon Pay</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Net Banking Fields */}
                                        {formData.type === 'netbanking' && (
                                            <div>
                                                <Label htmlFor="bank_account">Preferred Bank</Label>
                                                <Select
                                                    value={formData.bank_account}
                                                    onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select bank" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="sbi">State Bank of India</SelectItem>
                                                        <SelectItem value="hdfc">HDFC Bank</SelectItem>
                                                        <SelectItem value="icici">ICICI Bank</SelectItem>
                                                        <SelectItem value="axis">Axis Bank</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* BNPL Info */}
                                        {formData.type === 'bnpl' && (
                                            <div>
                                                <p className="text-sm text-gray-600">Buy Now Pay Later options will be available during checkout based on your eligibility.</p>
                                            </div>
                                        )}

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowAddForm(false);
                                                    resetForm();
                                                }}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddPaymentMethod}
                                                disabled={saving}
                                            >
                                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                Add Payment Method
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    <Separator />

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
