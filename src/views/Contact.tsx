"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Globe, Clock, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

import { usePerformance } from '../hooks/usePerformance';

const Contact = () => {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const { shouldReduceGfx } = usePerformance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Get form data
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error('Contact error:', error);
      // In a real app, you'd show a toast error here
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: Mail, label: "Email Us", value: "jmc.sjc@gmail.com", sub: "We'll respond within 24 hours" },
    { icon: Phone, label: "Call Us", value: "+880 1234 567890", sub: "Available 9am - 5pm" },
    { icon: MapPin, label: "Visit Us", value: "St. Joseph's College", sub: "97 Asad Avenue, Dhaka" },
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden">
      {/* Background Glows */}
      {!shouldReduceGfx && (
        <>
          <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-6-start)]/5 -top-48 -left-24" />
          <div className="atmospheric-glow w-[600px] h-[600px] bg-[var(--c-2-start)]/5 bottom-0 -right-24" />
        </>
      )}

      <div className="pt-40 pb-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <ScrollReveal>
            <div className="max-w-5xl mb-32">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-5 h-5 text-[var(--c-6-start)]" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--c-6-start)]/80">CONTACT US</span>
              </div>
              <h1 className="text-7xl md:text-[9rem] font-display font-bold leading-[0.85] tracking-tighter mb-12">
                <span className="block">GET IN</span>
                <span className="blue-text">TOUCH</span>
              </h1>
              <p className="text-xl md:text-3xl text-zinc-400 font-light leading-relaxed max-w-3xl">
                Have questions about our events or want to join the club? We&apos;re here to help you on your mathematical journey.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-12">
              <ScrollReveal direction="left">
                <div className="space-y-8">
                  {contactInfo.map((info, i) => (
                    <div key={i} className={`group relative p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 ${!shouldReduceGfx && 'hover:border-[var(--c-6-start)]/30 transition-all duration-500'} overflow-hidden`}>
                      <div className="flex items-start gap-8 relative z-10">
                        <div className={`w-16 h-16 rounded-3xl bg-[var(--c-6-start)]/10 border border-[var(--c-6-start)]/20 flex items-center justify-center flex-shrink-0 ${!shouldReduceGfx && 'group-hover:scale-110 group-hover:bg-[var(--c-6-start)] group-hover:text-white transition-all duration-500'} text-[var(--c-6-start)]`}>
                          <info.icon className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">{info.label}</h3>
                          <p className="text-2xl font-display font-bold text-white mb-2">{info.value}</p>
                          <p className="text-sm text-zinc-500 font-medium">{info.sub}</p>
                        </div>
                      </div>
                      {!shouldReduceGfx && <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[var(--c-6-start)]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />}
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={0.2}>
                <div className="p-10 rounded-[2.5rem] bg-[var(--c-6-start)]/5 border border-[var(--c-6-start)]/10 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3">
                      <Clock className="w-6 h-6 text-[var(--c-6-start)]" />
                      OFFICE HOURS
                    </h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Monday - Friday</span>
                        <span className="text-white font-bold text-sm">9:00 AM - 5:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Saturday</span>
                        <span className="text-white font-bold text-sm">10:00 AM - 2:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Sunday</span>
                        <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-[10px]">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <ScrollReveal direction="right">
                <div className="p-12 md:p-16 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--c-6-start)]/5 rounded-full blur-[120px] -mr-48 -mt-48" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-16">
                      <div className="w-16 h-16 rounded-3xl bg-[var(--c-6-start)] flex items-center justify-center text-white shadow-2xl shadow-[var(--c-6-start)]/20">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-display font-bold text-white">SEND A MESSAGE</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2">We usually respond within a few hours</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-2">Full Name</label>
                          <input 
                            name="name"
                            type="text"
                            required
                            placeholder="JOHN DOE"
                            className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-[var(--c-6-start)]/50 focus:ring-4 focus:ring-[var(--c-6-start)]/10 transition-all text-white placeholder:text-zinc-800 font-medium text-sm"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-2">Email Address</label>
                          <input 
                            name="email"
                            type="email"
                            required
                            placeholder="NAME@EXAMPLE.COM"
                            className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-[var(--c-6-start)]/50 focus:ring-4 focus:ring-[var(--c-6-start)]/10 transition-all text-white placeholder:text-zinc-800 font-medium text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-2">Subject</label>
                        <input 
                          name="subject"
                          type="text"
                          required
                          placeholder="HOW CAN WE HELP?"
                          className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-[var(--c-6-start)]/50 focus:ring-4 focus:ring-[var(--c-6-start)]/10 transition-all text-white placeholder:text-zinc-800 font-medium text-sm"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-2">Message</label>
                        <textarea 
                          name="message"
                          required
                          rows={6}
                          placeholder="TELL US MORE ABOUT YOUR INQUIRY..."
                          className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:border-[var(--c-6-start)]/50 focus:ring-4 focus:ring-[var(--c-6-start)]/10 transition-all text-white placeholder:text-zinc-800 font-medium text-sm resize-none"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={loading || success}
                        className={`w-full py-6 flex items-center justify-center gap-4 group ${
                          success 
                            ? 'bg-emerald-500 text-white rounded-full font-bold uppercase tracking-[0.3em] text-xs' 
                            : 'btn-metallic-blue'
                        }`}
                      >
                        {loading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : success ? (
                          <>
                            <CheckCircle2 className="w-6 h-6" />
                            Message Sent!
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="w-5 h-5 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
