"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, MapPin, Send } from 'lucide-react';
import { useContent } from '@/context/ContentContext';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { content } = useContent();
  const contact = content?.contact || {
    email: 'hello@josephitemath.club',
    phone: '+880 1712-345678',
    location: "St. Joseph's Campus, Math Wing"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="absolute top-6 right-6 z-10">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 md:p-12">
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-white mb-2 font-display">Contact Us</h2>
                <p className="text-zinc-400">We&apos;d love to hear from you. Send us a message.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[var(--c-6-start)]/10 rounded-xl flex items-center justify-center text-[var(--c-6-start)] shrink-0 border border-[var(--c-6-start)]/20">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Email</h4>
                      <p className="text-zinc-400 text-sm">{contact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[var(--c-6-start)]/10 rounded-xl flex items-center justify-center text-[var(--c-6-start)] shrink-0 border border-[var(--c-6-start)]/20">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Phone</h4>
                      <p className="text-zinc-400 text-sm">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[var(--c-6-start)]/10 rounded-xl flex items-center justify-center text-[var(--c-6-start)] shrink-0 border border-[var(--c-6-start)]/20">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Location</h4>
                      <p className="text-zinc-400 text-sm">{contact.location}</p>
                    </div>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Name" 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--c-6-start)]/50 transition-all"
                    />
                  </div>
                  <div>
                    <input 
                      type="email" 
                      placeholder="Email" 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--c-6-start)]/50 transition-all"
                    />
                  </div>
                  <div>
                    <textarea 
                      placeholder="Message" 
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--c-6-start)]/50 transition-all resize-none"
                    />
                  </div>
                  <button className="w-full py-4 btn-metallic-blue flex items-center justify-center gap-2">
                    Send Message <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
