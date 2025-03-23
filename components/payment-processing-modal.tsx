import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface PaymentProcessingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onError: () => void
  amount: number
}

export function PaymentProcessingModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  amount
}: PaymentProcessingModalProps) {
  const [stage, setStage] = useState<'processing' | 'success' | 'error'>('processing')
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    if (!isOpen) return
    
    // Reset state when modal opens
    setStage('processing')
    setProgress(0)
    
    // Simulate payment processing stages
    const timer1 = setTimeout(() => setProgress(30), 500)
    const timer2 = setTimeout(() => setProgress(60), 1200)
    const timer3 = setTimeout(() => setProgress(90), 1800)
    
    // Simulate payment completion
    const timer4 = setTimeout(() => {
      setProgress(100)
      // Simulate success (you could add logic for random failures in a demo)
      setStage('success')
      
      // Call the success callback after showing success for a moment
      const successTimer = setTimeout(() => {
        onSuccess()
      }, 1500)
      
      return () => clearTimeout(successTimer)
    }, 2500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [isOpen, onSuccess])
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {stage === 'processing' && 'Processing Payment'}
            {stage === 'success' && 'Payment Successful'}
            {stage === 'error' && 'Payment Failed'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {stage === 'processing' && (
            <>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <Loader2 className="w-20 h-20 animate-spin text-blue-500" />
                <CreditCard className="absolute w-8 h-8 text-blue-600" />
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-center text-muted-foreground">
                Please wait while we process your payment of ₹{amount.toFixed(2)}
              </p>
            </>
          )}
          
          {stage === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Your payment of ₹{amount.toFixed(2)} was successful</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your booking is being confirmed
                </p>
              </div>
            </>
          )}
          
          {stage === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Payment failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please try again or use a different payment method
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
