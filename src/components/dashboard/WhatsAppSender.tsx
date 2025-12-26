import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck } from '@/types/truck';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, CheckCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WhatsAppSenderProps {
  truck: Truck | null;
  onSend: (truck: Truck, message: string) => void;
}

const messageTemplates = [
  'مرحباً {driver}، يرجى الإسراع في الوصول إلى {destination}.',
  'تم تسجيل وصولك برقم {arrival}. يرجى التوجه إلى بوابة التفريغ.',
  'تنبيه: أنت خارج المسار المحدد. يرجى التواصل مع المكتب.',
  'شكراً على التزامك. تم إتمام الرحلة بنجاح.',
];

const WhatsAppSender = ({ truck, onSend }: WhatsAppSenderProps) => {
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  const handleSend = () => {
    if (truck && message) {
      onSend(truck, message);
      setMessage('');
      setOpen(false);
    }
  };

  const applyTemplate = (template: string) => {
    if (!truck) return;
    let msg = template
      .replace('{driver}', truck.driverName)
      .replace('{destination}', truck.destination || 'الوجهة')
      .replace('{arrival}', truck.arrivalNumber?.toString() || '-');
    setMessage(msg);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2 bg-success hover:bg-success/90"
          disabled={!truck}
        >
          <MessageCircle className="w-4 h-4" />
          إرسال واتساب
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-success" />
            </div>
            إرسال رسالة واتساب
          </DialogTitle>
        </DialogHeader>

        {truck && (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-secondary/50 rounded-xl">
              <p className="font-bold">{truck.driverName}</p>
              <p className="text-sm text-muted-foreground">{truck.driverPhone}</p>
              <p className="text-sm text-muted-foreground">{truck.plateNumber}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">قوالب سريعة:</p>
              <div className="flex flex-wrap gap-2">
                {messageTemplates.map((template, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyTemplate(template)}
                    className="px-3 py-1.5 text-xs bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    قالب {index + 1}
                  </motion.button>
                ))}
              </div>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="bg-secondary border-border min-h-[100px]"
            />

            <div className="flex gap-3">
              <Button onClick={handleSend} className="flex-1 bg-success hover:bg-success/90">
                <Send className="w-4 h-4 ml-2" />
                إرسال
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppSender;
