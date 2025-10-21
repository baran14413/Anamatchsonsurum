'use client';

import { useState } from "react";
import * as React from 'react';
import { useForm } from "react-hook-form";
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
import { ArrowLeft, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { langTr } from "@/languages/tr";
import { Icons } from "@/components/icons";

const formSchema = z.object({
    fullName: z.string()
      .min(2, { message: "İsim en az 2 karakter olmalıdır." })
      .max(20, { message: "İsim en fazla 20 karakter olabilir." }),
});

type SignupFormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
    },
    mode: "onChange",
  });
  
  const prevStep = () => step > 0 ? setStep(prev => prev - 1) : router.push('/');

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] | undefined;
    switch (step) {
      case 0: fieldsToValidate = ['fullName']; break;
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      // For now, just log it. We will build other steps later.
      console.log(form.getValues());
      // setStep(s => s + 1);
    }
  };
  
  const totalSteps = 6; // We'll have 6 steps in total
  const progressValue = ((step + 1) / totalSteps) * 100;
  
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b-0 bg-transparent px-4">
        <Button variant="ghost" size="icon" onClick={prevStep} disabled={isSubmitting}>
           <ArrowLeft className="h-6 w-6" />
        </Button>
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
                                placeholder="Demo" 
                                {...field} 
                                className="h-14 text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" 
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
