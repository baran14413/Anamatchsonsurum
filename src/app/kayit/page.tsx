'use client';

import { useState, useEffect, useRef } from "react";
import * as React from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { langTr } from "@/languages/tr";
import { Icons } from "@/components/icons";

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
    fullName: z.string()
      .min(2, { message: "İsim en az 2 karakter olmalıdır." })
      .max(20, { message: "İsim en fazla 20 karakter olabilir." }),
    dateOfBirth: z.date()
        .max(eighteenYearsAgo, { message: "En az 18 yaşında olmalısın." })
        .refine(date => !isNaN(date.getTime()), { message: "Lütfen geçerli bir tarih girin." }),
});

type SignupFormValues = z.infer<typeof formSchema>;

const DateInput = ({ value, onChange, disabled }: { value?: Date, onChange: (date: Date) => void, disabled?: boolean }) => {
    const [day, setDay] = useState(() => value ? String(value.getDate()).padStart(2, '0') : '');
    const [month, setMonth] = useState(() => value ? String(value.getMonth() + 1).padStart(2, '0') : '');
    const [year, setYear] = useState(() => value ? String(value.getFullYear()) : '');

    const dayRef = React.useRef<HTMLInputElement>(null);
    const monthRef = React.useRef<HTMLInputElement>(null);
    const yearRef = React.useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if(value) {
            setDay(String(value.getDate()).padStart(2, '0'));
            setMonth(String(value.getMonth() + 1).padStart(2, '0'));
            setYear(String(value.getFullYear()));
        }
    }, [value]);

    const handleDateChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string>>,
      field: 'day' | 'month' | 'year'
    ) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        let newDay = day, newMonth = month, newYear = year;

        if (field === 'day') {
            if (val.length > 0 && parseInt(val.charAt(0)) > 3) { /* do nothing */ }
            else if (val.length > 1 && parseInt(val) > 31) { /* do nothing */ }
            else { setDay(val); newDay = val; if (val.length === 2) monthRef.current?.focus(); }
        } else if (field === 'month') {
             if (val.length > 0 && parseInt(val.charAt(0)) > 1) { /* do nothing */ }
             else if (val.length > 1 && parseInt(val) > 12) { /* do nothing */ }
             else { setMonth(val); newMonth = val; if (val.length === 2) yearRef.current?.focus(); }
        } else { setYear(val); newYear = val; }

        if (newDay.length === 2 && newMonth.length === 2 && newYear.length === 4) {
            const date = new Date(`${newYear}-${newMonth}-${newDay}T00:00:00`);
            if (!isNaN(date.getTime()) && date.getDate() === parseInt(newDay) && date.getMonth() + 1 === parseInt(newMonth)) {
                onChange(date);
            } else { onChange(new Date('invalid')); }
        } else { onChange(new Date('invalid')); }
    };
    
    return (
        <div className="flex items-center gap-2">
            <Input ref={dayRef} placeholder="GG" maxLength={2} value={day} onChange={(e) => handleDateChange(e, setDay, 'day')} disabled={disabled} inputMode="numeric" className="h-14 text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary text-center p-0 w-16 bg-transparent" />
            <span className="text-2xl text-muted-foreground">/</span>
            <Input ref={monthRef} placeholder="AA" maxLength={2} value={month} onChange={(e) => handleDateChange(e, setMonth, 'month')} disabled={disabled} inputMode="numeric" className="h-14 text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary text-center p-0 w-16 bg-transparent" />
            <span className="text-2xl text-muted-foreground">/</span>
            <Input ref={yearRef} placeholder="YYYY" maxLength={4} value={year} onChange={(e) => handleDateChange(e, setYear, 'year')} disabled={disabled} inputMode="numeric" className="h-14 text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary text-center p-0 w-24 bg-transparent" />
        </div>
    )
}


export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageStatus, setAgeStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: undefined
    },
    mode: "onChange",
  });

  const handleDateOfBirthChange = (date: Date) => {
    form.setValue('dateOfBirth', date, { shouldValidate: true });
    if (isNaN(date.getTime())) {
        setAgeStatus('unknown');
        return;
    }
    const ageDifMs = Date.now() - date.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    setAgeStatus(age >= 18 ? 'valid' : 'invalid');
  };
  
  const prevStep = () => step > 0 ? setStep(prev => prev - 1) : router.push('/');

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] | undefined;
    switch (step) {
      case 0: fieldsToValidate = ['fullName']; break;
      case 1: fieldsToValidate = ['dateOfBirth']; break;
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (step === totalSteps - 1) {
        // Final submit logic here
        console.log(form.getValues());
      } else {
        setStep(s => s + 1);
      }
    }
  };
  
  const totalSteps = 6;
  const progressValue = ((step + 1) / totalSteps) * 100;
  
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b-0 bg-transparent px-4">
        <div className="flex flex-1 items-center gap-4">
             <Button variant="ghost" size="icon" onClick={prevStep} disabled={isSubmitting}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <Progress value={progressValue} className="h-2" />
        </div>
      </header>
      
      <Form {...form}>
         <form className="flex flex-1 flex-col p-6 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              
              {step === 0 && (
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold">Adın ne?</h1>
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Input 
                                placeholder="Adın" 
                                {...field} 
                                className="h-14 text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary bg-transparent" 
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )} />
                   <p className="text-muted-foreground">
                    Profilinde bu şekilde görünecek. Bunu daha sonra değiştiremezsin.
                   </p>
                </div>
              )}

              {step === 1 && (
                 <div className="space-y-4">
                    <h1 className="text-3xl font-bold">Doğum tarihin?</h1>
                    <Controller
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field, fieldState }) => (
                        <FormItem>
                            <FormControl>
                            <DateInput value={field.value} onChange={handleDateOfBirthChange} />
                            </FormControl>
                            {ageStatus === 'valid' && <div className="flex items-center text-green-600 pt-2 text-sm"><CheckCircle className="mr-2 h-4 w-4" />18 yaşından büyüksünüz.</div>}
                            {ageStatus === 'invalid' && <div className="flex items-center text-red-600 pt-2 text-sm"><XCircle className="mr-2 h-4 w-4" />18 yaşından küçükler kullanamaz.</div>}
                            {fieldState.error && ageStatus !== 'invalid' && <FormMessage>{fieldState.error.message}</FormMessage>}
                        </FormItem>
                        )}
                    />
                    <p className="text-muted-foreground">
                        Profilinde yaşın gösterilir, doğum tarihin değil.
                    </p>
                </div>
              )}


            </div>

            <div className="shrink-0 pt-6">
                <Button type="button" onClick={handleNextStep} className="w-full h-14 rounded-full text-lg font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : "İlerle"}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
