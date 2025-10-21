'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { langTr } from '@/languages/tr';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';


const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const lifestyleSchema = z.object({
    drinking: z.string().optional(),
    smoking: z.string().optional(),
    workout: z.string().optional(),
    pets: z.string().optional(),
}).optional();


const formSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'İsim en az 2 karakter olmalıdır.' })
    .max(20, { message: 'İsim en fazla 20 karakter olabilir.' }),
  dateOfBirth: z.any().refine((val) => val instanceof Date && !isNaN(val.getTime()), {
    message: "Lütfen geçerli bir tarih girin.",
  }).refine((val) => val <= eighteenYearsAgo, {
    message: 'En az 18 yaşında olmalısın.',
  }),
  gender: z.enum(['female', 'male'], {
    required_error: 'Lütfen cinsiyetinizi seçin.',
  }),
  showGender: z.boolean().default(true),
  lookingFor: z.string({ required_error: 'Lütfen bir seçim yapın.' }),
  distancePreference: z.number().min(1).max(160).default(80),
  lifestyle: lifestyleSchema,
});

type SignupFormValues = z.infer<typeof formSchema>;
type LifestyleKeys = keyof z.infer<typeof lifestyleSchema>;

type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;


const DateInput = ({
  value,
  onChange,
  disabled,
}: {
  value?: Date;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const dayRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const yearRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (value && !isNaN(value.getTime())) {
        setDay(String(value.getDate()).padStart(2, '0'));
        setMonth(String(value.getMonth() + 1).padStart(2, '0'));
        setYear(String(value.getFullYear()));
    } else {
        setDay('');
        setMonth('');
        setYear('');
    }
  }, [value]);


  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: 'day' | 'month' | 'year'
  ) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    let newDay = day,
      newMonth = month,
      newYear = year;

    if (field === 'day') {
      if (val.length > 0 && parseInt(val.charAt(0)) > 3) {
      } else if (val.length > 1 && parseInt(val) > 31) {
      } else {
        setDay(val);
        newDay = val;
        if (val.length === 2) monthRef.current?.focus();
      }
    } else if (field === 'month') {
      if (val.length > 0 && parseInt(val.charAt(0)) > 1) {
      } else if (val.length > 1 && parseInt(val) > 12) {
      } else {
        setMonth(val);
        newMonth = val;
        if (val.length === 2) yearRef.current?.focus();
      }
    } else {
      setYear(val);
      newYear = val;
    }

    if (newDay.length === 2 && newMonth.length === 2 && newYear.length === 4) {
      const date = new Date(`${newYear}-${newMonth}-${newDay}T00:00:00`);
      if (
        !isNaN(date.getTime()) &&
        date.getDate() === parseInt(newDay) &&
        date.getMonth() + 1 === parseInt(newMonth)
      ) {
        onChange(date);
      } else {
        onChange(null); // Send null for invalid date
      }
    } else {
      onChange(null); // Send null if not complete
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={dayRef}
        placeholder="GG"
        maxLength={2}
        value={day}
        onChange={(e) => handleDateChange(e, setDay, 'day')}
        disabled={disabled}
        inputMode="numeric"
        className="h-14 w-16 bg-transparent p-0 text-center text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
      />
      <span className="text-2xl text-muted-foreground">/</span>
      <Input
        ref={monthRef}
        placeholder="AA"
        maxLength={2}
        value={month}
        onChange={(e) => handleDateChange(e, setMonth, 'month')}
        disabled={disabled}
        inputMode="numeric"
        className="h-14 w-16 bg-transparent p-0 text-center text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
      />
      <span className="text-2xl text-muted-foreground">/</span>
      <Input
        ref={yearRef}
        placeholder="YYYY"
        maxLength={4}
        value={year}
        onChange={(e) => handleDateChange(e, setYear, 'year')}
        disabled={disabled}
        inputMode="numeric"
        className="h-14 w-24 bg-transparent p-0 text-center text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
      />
    </div>
  );
};

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: undefined,
      gender: undefined,
      showGender: true,
      lookingFor: undefined,
      distancePreference: 80,
      lifestyle: {},
    },
    mode: 'onChange',
  });
  
  const dateOfBirthValue = form.watch('dateOfBirth');
  const lifestyleValues = form.watch('lifestyle');

  const ageStatus = useMemo(() => {
    if (dateOfBirthValue && !isNaN(dateOfBirthValue.getTime())) {
      const ageDifMs = Date.now() - dateOfBirthValue.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return age >= 18 ? 'valid' : 'invalid';
    }
    return 'unknown';
  }, [dateOfBirthValue]);

  const handleDateOfBirthChange = (date: Date | null) => {
      form.setValue('dateOfBirth', date, { shouldValidate: true });
  };

  const prevStep = () => (step > 0 ? setStep((prev) => prev - 1) : router.push('/'));

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] | undefined;
    switch (step) {
      case 0:
        fieldsToValidate = ['fullName'];
        break;
      case 1:
        fieldsToValidate = ['dateOfBirth'];
        if (ageStatus !== 'valid') {
            form.trigger('dateOfBirth'); // Manually trigger to show error
            return;
        }
        break;
      case 2:
        fieldsToValidate = ['gender'];
        break;
      case 3:
        fieldsToValidate = ['lookingFor'];
        break;
      case 4:
        fieldsToValidate = ['distancePreference'];
        break;
       case 5:
        // This step is optional, so we just move on
        break;
    }

    const isValid = fieldsToValidate ? await form.trigger(fieldsToValidate) : true;
    if (isValid) {
      if (step === totalSteps - 1) {
        // Final submit logic here
        console.log(form.getValues());
      } else {
        setStep((s) => s + 1);
      }
    }
  };

  const totalSteps = 6;
  const progressValue = ((step + 1) / totalSteps) * 100;

  const fullNameValue = form.watch('fullName');
  const genderValue = form.watch('gender');
  const lookingForValue = form.watch('lookingFor');
  const distanceValue = form.watch('distancePreference');
  const lifestyleQuestions = langTr.signup.step9;
  const lifestyleAnswerCount = Object.values(lifestyleValues || {}).filter(v => v).length;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b-0 bg-transparent px-4">
        <div className="flex flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevStep}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Progress value={progressValue} className="h-2" />
        </div>
      </header>

      <Form {...form}>
        <form className="flex flex-1 flex-col overflow-hidden p-6">
          <div className="flex-1 min-h-0">
            {step === 0 && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">{langTr.signup.step2.title}</h1>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={langTr.signup.step2.placeholder}
                          {...field}
                          className="h-14 rounded-none border-0 border-b-2 bg-transparent text-2xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-muted-foreground">
                  {langTr.signup.step2.label}
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">{langTr.signup.step3.title}</h1>
                <Controller
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <DateInput
                          value={field.value}
                          onChange={handleDateOfBirthChange}
                        />
                      </FormControl>
                      {ageStatus === 'valid' && (
                        <div className="flex items-center pt-2 text-sm text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {langTr.signup.step3.ageConfirm}
                        </div>
                      )}
                      {ageStatus === 'invalid' && (
                        <div className="flex items-center pt-2 text-sm text-red-600">
                          <XCircle className="mr-2 h-4 w-4" />
                          {langTr.signup.step3.ageError}
                        </div>
                      )}
                       <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <p className="text-muted-foreground">
                  {langTr.signup.step3.label}
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold">{langTr.signup.step4.title}</h1>
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-14 w-full rounded-full text-lg',
                      genderValue === 'female' &&
                        'border-2 border-primary text-primary'
                    )}
                    onClick={() =>
                      form.setValue('gender', 'female', { shouldValidate: true })
                    }
                  >
                    {langTr.signup.step4.woman}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-14 w-full rounded-full text-lg',
                      genderValue === 'male' &&
                        'border-2 border-primary text-primary'
                    )}
                    onClick={() =>
                      form.setValue('gender', 'male', { shouldValidate: true })
                    }
                  >
                    {langTr.signup.step4.man}
                  </Button>
                  <FormMessage>{form.formState.errors.gender?.message}</FormMessage>
                </div>
                <FormField
                  control={form.control}
                  name="showGender"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="showGender"
                        />
                      </FormControl>
                      <Label className="font-normal" htmlFor="showGender">
                        Profilimde cinsiyetimi göster
                      </Label>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
                <div className="flex flex-col flex-1 justify-center space-y-4">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">{langTr.signup.step5.title}</h1>
                        <p className="text-muted-foreground">
                        {langTr.signup.step5.label}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        {langTr.signup.step5.options.map((option) => (
                        <div
                            key={option.id}
                            onClick={() => form.setValue('lookingFor', option.id, { shouldValidate: true })}
                            className={cn(
                                "flex cursor-pointer flex-col items-center justify-center space-y-1 rounded-lg border-2 p-4 text-center transition-all hover:bg-muted/50",
                                lookingForValue === option.id ? "border-primary" : "border-card bg-card"
                            )}
                        >
                            <span className="text-3xl">{option.emoji}</span>
                            <p className="font-semibold text-sm">{option.label}</p>
                        </div>
                        ))}
                    </div>
                    <FormMessage>{form.formState.errors.lookingFor?.message}</FormMessage>
                </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{langTr.signup.step7.title}</h1>
                    <p className="text-muted-foreground">{langTr.signup.step7.description}</p>
                </div>
                <div className="space-y-4 pt-8">
                    <div className="flex justify-between items-baseline">
                        <Label className="text-lg">{langTr.signup.step7.label}</Label>
                        <span className="text-lg font-bold text-foreground">{distanceValue} {langTr.signup.step7.unit}</span>
                    </div>
                    <Controller
                        control={form.control}
                        name="distancePreference"
                        render={({ field }) => (
                            <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                max={160}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        )}
                    />
                </div>
                <p className="text-muted-foreground text-center pt-8">{langTr.signup.step7.info}</p>
              </div>
            )}
            
            {step === 5 && (
                <ScrollArea className="flex-1 -mr-6 pr-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold">{lifestyleQuestions.title.replace('{name}', fullNameValue || '')}</h1>
                            <p className="text-muted-foreground">{lifestyleQuestions.description}</p>
                        </div>
                        <div className="space-y-8">
                            {(Object.keys(lifestyleQuestions) as Array<keyof typeof lifestyleQuestions>)
                                .filter(key => key !== 'title' && key !== 'description')
                                .map(key => {
                                    const question = lifestyleQuestions[key as Exclude<keyof typeof lifestyleQuestions, 'title'|'description'>];
                                    const Icon = LucideIcons[question.icon as IconName] as React.ElementType || LucideIcons.Sparkles;

                                    return (
                                        <div key={key}>
                                            <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                                {question.question}
                                            </h2>
                                            <div className="flex flex-wrap gap-2">
                                                {question.options.map(option => (
                                                    <Badge
                                                        key={option.id}
                                                        variant={lifestyleValues?.[key as LifestyleKeys] === option.id ? 'default' : 'secondary'}
                                                        onClick={() => form.setValue(`lifestyle.${key as LifestyleKeys}`, option.id, { shouldValidate: true })}
                                                        className="cursor-pointer py-1.5 px-3 text-sm"
                                                    >
                                                        {option.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )
                            })}
                        </div>
                    </div>
                </ScrollArea>
            )}
          </div>

          <div className="shrink-0 pt-6">
            <Button
              type="button"
              onClick={handleNextStep}
              className="h-14 w-full rounded-full text-lg font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Icons.logo width={24} height={24} className="animate-pulse" />
              ) : (
                step === 5 ? `İlerle (${lifestyleAnswerCount}/4)` : 'İlerle'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
