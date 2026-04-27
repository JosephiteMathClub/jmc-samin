"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ShieldAlert, Mail, Phone, MapPin, Database, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { DashboardFileUpload } from '../DashboardFileUpload';
import { DashboardButton } from '../DashboardButton';

interface DashboardSiteSectionProps {
  data: any;
  contactData: any;
  registrationData: any;
  updateField: (field: string, value: any) => void;
  updateContactField: (field: string, value: any) => void;
  updateContactNestedField: (sub: string, field: string, value: any) => void;
  updateRegistrationField: (field: string, value: any) => void;
  uploading: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
  shouldReduceGfx: boolean;
  seedDatabase: () => Promise<void>;
  supabase: any;
}

const DashboardSiteSectionComponent: React.FC<DashboardSiteSectionProps> = ({
  data,
  contactData,
  registrationData,
  updateField,
  updateContactField,
  updateContactNestedField,
  updateRegistrationField,
  uploading,
  handleFileUpload,
  shouldReduceGfx,
  seedDatabase,
  supabase
}) => {
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeed = async () => {
    if (!window.confirm('This will seed the database with initial content. Are you sure?')) return;
    setIsSeeding(true);
    try {
      await seedDatabase();
      alert('Database seeded successfully!');
    } catch (err: any) {
      alert('Error seeding database: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <motion.div
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DashboardSection icon={Globe} title="General Site Settings" description="Global information that appears across multiple pages.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardFormField 
            label="Club Name (Logo Text)" 
            value={data?.title} 
            onChange={(val) => updateField('title', val)} 
          />
          <DashboardFormField 
            label="Logo Subtext" 
            value={data?.logoSubtext} 
            onChange={(val) => updateField('logoSubtext', val)} 
          />
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">Event Mode</h4>
              <p className="text-[10px] text-zinc-500 font-medium">Enable specialized participation tracking with QR scanning for active events.</p>
            </div>
            <input 
              type="checkbox" 
              id="eventMode"
              checked={data?.eventMode || false} 
              onChange={(e) => updateField('eventMode', e.target.checked)}
              className="w-6 h-6 rounded-lg border-white/10 bg-white/5 text-amber-500 focus:ring-amber-500 transition-all cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4 p-5 rounded-2xl bg-red-500/5 border border-red-500/10">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">Maintenance Mode</h4>
              <p className="text-[10px] text-zinc-500 font-medium">Take the site offline for non-admin users while performing updates.</p>
            </div>
            <input 
              type="checkbox" 
              id="maintenanceMode"
              checked={data?.maintenanceMode || false} 
              onChange={(e) => updateField('maintenanceMode', e.target.checked)}
              className="w-6 h-6 rounded-lg border-white/10 bg-white/5 text-red-500 focus:ring-red-500 transition-all cursor-pointer"
            />
          </div>
        </div>

        {data?.maintenanceMode && (
          <div className="mt-4">
            <DashboardFormField 
              label="Maintenance Message" 
              value={data?.maintenanceMessage} 
              onChange={(val) => updateField('maintenanceMessage', val)} 
            />
          </div>
        )}

        <div className="mt-8">
           <DashboardFileUpload 
              label="Site Logo (Icon)" 
              value={data?.logoUrl} 
              uploading={uploading === 'site-logoUrl'}
              onUpload={(e) => handleFileUpload(e, ['site', 'logoUrl'], (newUrl) => updateField('logoUrl', newUrl))} 
            />
        </div>
      </DashboardSection>

      <DashboardSection icon={Mail} title="Contact Information" description="Update the club's contact details and social links.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardFormField 
            label="Email" 
            value={contactData?.email} 
            onChange={(val) => updateContactField('email', val)} 
          />
          <DashboardFormField 
            label="Phone" 
            value={contactData?.phone} 
            onChange={(val) => updateContactField('phone', val)} 
          />
          <DashboardFormField 
            label="Address" 
            value={contactData?.address} 
            onChange={(val) => updateContactField('address', val)} 
          />
          <DashboardFormField 
            label="Map Embed URL" 
            value={contactData?.mapUrl} 
            onChange={(val) => updateContactField('mapUrl', val)} 
          />
        </div>
        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Social Links</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardFormField 
                label="Facebook" 
                value={contactData?.socials?.facebook} 
                onChange={(val) => updateContactNestedField('socials', 'facebook', val)} 
            />
            <DashboardFormField 
                label="Twitter/X" 
                value={contactData?.socials?.twitter} 
                onChange={(val) => updateContactNestedField('socials', 'twitter', val)} 
            />
            <DashboardFormField 
                label="Instagram" 
                value={contactData?.socials?.instagram} 
                onChange={(val) => updateContactNestedField('socials', 'instagram', val)} 
            />
            <DashboardFormField 
                label="LinkedIn" 
                value={contactData?.socials?.linkedin} 
                onChange={(val) => updateContactNestedField('socials', 'linkedin', val)} 
            />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection icon={RefreshCw} title="Registration Settings" description="Toggle registration visibility and manage payment instructions.">
         <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <input 
                type="checkbox" 
                id="isRegistrationOpen"
                checked={registrationData?.registrationOpen} 
                onChange={(e) => updateRegistrationField('registrationOpen', e.target.checked)}
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="isRegistrationOpen" className="text-xs font-bold uppercase tracking-widest text-white cursor-pointer">Registration is Open</label>
            </div>
            
            {!registrationData?.registrationOpen && (
              <DashboardFormField 
                label="Registration Closed Message" 
                type="textarea"
                value={registrationData?.registrationClosedMessage} 
                onChange={(val) => updateRegistrationField('registrationClosedMessage', val)} 
              />
            )}

            <DashboardFormField 
              label="bKash Number" 
              value={registrationData?.bkashNumber} 
              onChange={(val) => updateRegistrationField('bkashNumber', val)} 
            />
            
            <DashboardFormField 
              label="Fee Amount" 
              value={registrationData?.fee} 
              onChange={(val) => updateRegistrationField('fee', val)} 
            />
            
            <DashboardFormField 
              label="Payment Instructions (One per line)" 
              type="textarea"
              value={Array.isArray(registrationData?.instructions) ? registrationData.instructions.join('\n') : registrationData?.instructions} 
              onChange={(val) => updateRegistrationField('instructions', val.split('\n').filter((s: string) => s.trim()))} 
              description="Enter each instruction step on a new line."
            />

            <DashboardFormField 
              label="Cash Instructions" 
              type="textarea"
              value={registrationData?.cashInstructions} 
              onChange={(val) => updateRegistrationField('cashInstructions', val)} 
            />

            <DashboardFormField 
              label="Declaration Text" 
              type="textarea"
              value={registrationData?.declaration} 
              onChange={(val) => updateRegistrationField('declaration', val)} 
            />
         </div>
      </DashboardSection>

      <DashboardSection icon={Database} title="Database Management" description="Tools for database maintenance and data recovery.">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
             <div className="flex items-center gap-3 text-amber-500">
               <AlertCircle className="w-5 h-5" />
               <p className="text-[10px] font-bold uppercase tracking-widest">Initial Setup</p>
             </div>
             <p className="text-xs text-zinc-400">If your database is empty or needs resetting, you can seed it with the default club content.</p>
             <DashboardButton 
                onClick={handleSeed} 
                variant="outline" 
                loading={isSeeding}
                className="w-full sm:w-auto"
                icon={RefreshCw}
                label="Seed Default Content"
             />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection icon={ShieldAlert} title="Danger Zone" description="High-risk administrative operations.">
        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-4">
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Experimental Features</p>
          <p className="text-xs text-zinc-400">These actions could result in data loss or structural changes to the site content structure.</p>
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardSiteSection = React.memo(DashboardSiteSectionComponent);
DashboardSiteSection.displayName = 'DashboardSiteSection';
