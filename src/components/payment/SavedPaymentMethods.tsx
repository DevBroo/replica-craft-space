import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Smartphone, Building, Wallet, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethod {
    id: string;
    user_id: string;
    type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'bnpl';
    provider: 'phonepe';
    last_four?: string;
    brand?: string;
    cardholder_name?: string;
    expiry_month?: number;
    expiry_year?: number;
    is_default: boolean;
    is_verified: boolean;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

interface SavedPaymentMethodsProps {
    onPaymentMethodSelect: (method: PaymentMethod | 'new') => void;
    onAddNewMethod: () => void;
    selectedMethodId?: string;
}

const PAYMENT_TYPE_ICONS = {
    card: CreditCard,
    upi: Smartphone,
    netbanking: Building,
    wallet: Wallet,
    bnpl: CreditCard
};

export const SavedPaymentMethods: React.FC<SavedPaymentMethodsProps> = ({
    onPaymentMethodSelect,
    onAddNewMethod,
    selectedMethodId
}) => {
    const { user } = useAuth();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>(selectedMethodId || '');

    useEffect(() => {
        if (user) {
            loadPaymentMethods();
        }
    }, [user]);

    useEffect(() => {
        if (paymentMethods.length > 0 && !selectedMethodId) {
            // Auto-select default payment method if available
            const defaultMethod = paymentMethods.find(method => method.is_default);
            if (defaultMethod) {
                setSelectedValue(defaultMethod.id);
                onPaymentMethodSelect(defaultMethod);
            }
        }
    }, [paymentMethods, selectedMethodId, onPaymentMethodSelect]);

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
                description: 'Failed to load saved payment methods',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectionChange = (value: string) => {
        setSelectedValue(value);

        if (value === 'new') {
            onPaymentMethodSelect('new');
        } else {
            const selectedMethod = paymentMethods.find(method => method.id === value);
            if (selectedMethod) {
                onPaymentMethodSelect(selectedMethod);
            }
        }
    };

    const getPaymentMethodDisplay = (method: PaymentMethod) => {
        const IconComponent = PAYMENT_TYPE_ICONS[method.type];

        switch (method.type) {
            case 'card':
                return {
                    icon: <IconComponent className="h-5 w-5 text-blue-600" />,
                    title: `${method.brand?.toUpperCase() || 'Card'} •••• ${method.last_four}`,
                    subtitle: method.cardholder_name
                };
            case 'upi':
                return {
                    icon: <IconComponent className="h-5 w-5 text-green-600" />,
                    title: 'UPI',
                    subtitle: method.metadata?.upi_id || 'UPI Payment'
                };
            case 'wallet':
                return {
                    icon: <IconComponent className="h-5 w-5 text-purple-600" />,
                    title: 'Digital Wallet',
                    subtitle: method.metadata?.wallet_provider || 'Wallet Payment'
                };
            case 'netbanking':
                return {
                    icon: <IconComponent className="h-5 w-5 text-indigo-600" />,
                    title: 'Net Banking',
                    subtitle: method.metadata?.bank_account || 'Bank Payment'
                };
            case 'bnpl':
                return {
                    icon: <IconComponent className="h-5 w-5 text-orange-600" />,
                    title: 'Buy Now Pay Later',
                    subtitle: 'Pay later options'
                };
            default:
                return {
                    icon: <CreditCard className="h-5 w-5 text-gray-600" />,
                    title: 'Payment Method',
                    subtitle: ''
                };
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading payment methods...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Select Payment Method
                </CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup value={selectedValue} onValueChange={handleSelectionChange}>
                    {/* Saved Payment Methods */}
                    {paymentMethods.map((method) => {
                        const display = getPaymentMethodDisplay(method);

                        return (
                            <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value={method.id} id={method.id} />
                                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        {display.icon}
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">{display.title}</span>
                                                {method.is_default && (
                                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                                )}
                                                {method.is_verified && (
                                                    <Badge variant="outline" className="text-xs">Verified</Badge>
                                                )}
                                            </div>
                                            {display.subtitle && (
                                                <p className="text-sm text-gray-500">{display.subtitle}</p>
                                            )}
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        );
                    })}

                    {/* Add New Payment Method Option */}
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 border-dashed">
                        <RadioGroupItem value="new" id="new" />
                        <Label htmlFor="new" className="flex-1 cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <div className="h-5 w-5 border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
                                    <Plus className="h-3 w-3 text-gray-400" />
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Add New Payment Method</span>
                                    <p className="text-sm text-gray-500">Use a different payment method for this transaction</p>
                                </div>
                            </div>
                        </Label>
                    </div>
                </RadioGroup>

                {paymentMethods.length === 0 && (
                    <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No saved payment methods found</p>
                        <Button onClick={onAddNewMethod} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment Method
                        </Button>
                    </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Secure:</strong> All payment methods are processed through PhonePe's secure gateway.
                        Your payment information is encrypted and never stored on our servers.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};


