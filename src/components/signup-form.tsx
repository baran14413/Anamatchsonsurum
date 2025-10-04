"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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

const formSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  // We will add more fields for other steps later
});

type SignupFormValues = z.infer<typeof formSchema>;

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
                            className="border-0 border-b-2 rounded-none px-0 text-xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
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
            </div>

            <div className="shrink-0">
              <Button
                type="button"
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (isValid) {
                    // For now, we don't have a next step, but this is where it would go
                    // nextStep();
                    toast({title: "Şimdilik bu kadar!", description: "Tasarım devam ediyor."})
                  }
                }}
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
