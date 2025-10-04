"use client";

import { useState, useMemo, useRef, createRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
    name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
    dateOfBirth: z.date().max(eighteenYearsAgo, { message: "En az 18 yaşında olmalısın." })
        .refine(date => !isNaN(date.getTime()), { message: "Geçerli bir tarih girin." }),
});

type SignupFormValues = z.infer<typeof formSchema>;

const DateInput = ({ value, onChange, disabled }: { value?: Date, onChange: (date: Date) => void, disabled?: boolean }) => {
    const [day, setDay] = useState(() => value ? String(value.getDate()).padStart(2, '0') : '');
    const [month, setMonth] = useState(() => value ? String(value.getMonth() + 1).padStart(2, '0') : '');
    const [year, setYear] = useState(() => value ? String(value.getFullYear()) : '');

    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

    const handleDateChange = (newDay: string, newMonth: string, newYear: string) => {
        setDay(newDay);
        setMonth(newMonth);
        setYear(newYear);

        if (newDay.length === 2 && newMonth.length === 2 && newYear.length === 4) {
            const date = new Date(`${newYear}-${newMonth}-${newDay}`);
             // Check if the constructed date is valid
            if (!isNaN(date.getTime()) && 
                date.getDate() === parseInt(newDay, 10) &&
                date.getMonth() + 1 === parseInt(newMonth, 10) &&
                date.getFullYear() === parseInt(newYear, 10)) {
                onChange(date);
            } else {
                 // Propagate an invalid date to trigger validation
                 onChange(new Date('invalid'));
            }
        }
    };
    
    const smartInputHandler = (
      e: React.ChangeEvent<HTMLInputElement>,
      field: 'day' | 'month'
    ) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      
      if (field === 'day') {
        if (parseInt(val) > 31) return;
        if (val.length > 1 && parseInt(val.charAt(0)) > 3) return;
        handleDateChange(val, month, year);
        if (val.length === 2) monthRef.current?.focus();

      } else if (field === 'month') {
        if (parseInt(val) > 12) return;
        if (val.length > 1 && parseInt(val.charAt(0)) > 1) return;
        handleDateChange(day, val, year);
        if (val.length === 2) yearRef.current?.focus();
      }
    };

    return (
        <div className="flex items-center gap-2">
            <Input
                placeholder="GG"
                maxLength={2}
                value={day}
                onChange={(e) => smartInputHandler(e, 'day')}
                disabled={disabled}
                className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
            <span className="text-xl text-muted-foreground">/</span>
            <Input
                ref={monthRef}
                placeholder="AA"
                maxLength={2}
                value={month}
                onChange={(e) => smartInputHandler(e, 'month')}
                disabled={disabled}
                 className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
            <span className="text-xl text-muted-foreground">/</span>
            <Input
                ref={yearRef}
                placeholder="YYYY"
                maxLength={4}
                value={year}
                onChange={(e) => {
                     const val = e.target.value.replace(/[^0-9]/g, '');
                     handleDateChange(day, month, val);
                }}
                disabled={disabled}
                className="text-xl text-center h-14 w-24 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
        </div>
    )
}

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // This will be the final submit function when all steps are complete
  async function onSubmit(data: SignupFormValues) {
    // For now, we just log the data and move to a placeholder success page
    console.log(data);
    // In the future, this will handle user creation in Firebase
    // nextStep(); 
  }
  
  const progressValue = (step / 5) * 100; // Assuming 5 steps total for now

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['name'];
    if (step === 2) fieldsToValidate = ['dateOfBirth'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (step === 2) {
         toast({title: "Şimdilik bu kadar!", description: "Tasarım devam ediyor."})
      } else {
        nextStep();
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4">
        {step > 1 && (
          <Button variant="ghost" size="icon" onClick={prevStep}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
        <Progress value={progressValue} className="h-2 flex-1" />
      </header>
      <main className="flex flex-1 flex-col p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4">
              {step === 1 && (
                <>
                  <h1 className="text-3xl font-bold">Adın ne?</h1>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Adını gir"
                            className="border-0 border-b-2 rounded-none px-0 text-xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-transparent"
                            {...field}
                          />
                        </FormControl>
                        <FormLabel className="text-muted-foreground">
                          Profilinde bu şekilde görünecek. Bunu daha sonra değiştiremezsin.
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
               {step === 2 && (
                <>
                  <h1 className="text-3xl font-bold">Doğum tarihin?</h1>
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="pt-8">
                            <FormControl>
                                <DateInput {...field} />
                            </FormControl>
                           <FormLabel className="text-muted-foreground pt-2 block">
                             Profilinde yaşın gösterilir, doğum tarihin değil.
                           </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </>
              )}
            </div>

            <div className="shrink-0">
              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full h-14 rounded-full text-lg font-bold"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'İlerle'}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
