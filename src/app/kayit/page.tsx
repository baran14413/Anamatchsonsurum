'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'İsim en az 2 karakter olmalıdır.' })
    .max(20, { message: 'İsim en fazla 20 karakter olabilir.' }),
  dateOfBirth: z
    .date()
    .max(eighteenYearsAgo, { message: 'En az 18 yaşında olmalısın.' })
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Lütfen geçerli bir tarih girin.',
    }),
  gender: z.enum(['female', 'male'], {
    required_error: 'Lütfen cinsiyetinizi seçin.',
  }),
  showGender: z.boolean().default(true),
  lookingFor: z.string({ required_error: 'Lütfen bir seçim yapın.' }),
  distancePreference: z.number().min(1).max(160).default(80),
});

type SignupFormValues = z.infer<typeof formSchema>;

const DateInput = ({
  value,
  onChange,
  disabled,
}: {
  value?: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}) => {
  const [day, setDay] = useState(() =>
    value ? String(value.getDate()).padStart(2, '0') : ''
  );
  const [month, setMonth] = useState(() =>
    value ? String(value.getMonth() + 1).padStart(2, '0') : ''
  );
  const [year, setYear] = useState(() =>
    value ? String(value.getFullYear()) : ''
  );

  const dayRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const yearRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
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
    let newDay = day,
      newMonth = month,
      newYear = year;

    if (field === 'day') {
      if (val.length > 0 && parseInt(val.charAt(0)) > 3) {
        /* do nothing */
      } else if (val.length > 1 && parseInt(val) > 31) {
        /* do nothing */
      } else {
        setDay(val);
        newDay = val;
        if (val.length === 2) monthRef.current?.focus();
      }
    } else if (field === 'month') {
      if (val.length > 0 && parseInt(val.charAt(0)) > 1) {
        /* do nothing */
      } else if (val.length > 1 && parseInt(val) > 12) {
        /* do nothing */
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
        onChange(new Date('invalid'));
      }
    } else {
      onChange(new Date('invalid'));
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
  const [ageStatus, setAgeStatus] = useState<'valid' | 'invalid' | 'unknown'>(
    'unknown'
  );

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: undefined,
      showGender: true,
      distancePreference: 80,
    },
    mode: 'onChange',
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

  const prevStep = () => (step > 0 ? setStep((prev) => prev - 1) : router.push('/'));

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] | undefined;
    switch (step) {
      case 0:
        fieldsToValidate = ['fullName'];
        break;
      case 1:
        fieldsToValidate = ['dateOfBirth'];
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
    }

    const isValid = await form.trigger(fieldsToValidate);
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

  const genderValue = form.watch('gender');
  const lookingForValue = form.watch('lookingFor');
  const distanceValue = form.watch('distancePreference');

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
          <div className="flex-1 flex flex-col min-h-0">
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
                      {fieldState.error && ageStatus !== 'invalid' && (
                        <FormMessage>{fieldState.error.message}</FormMessage>
                      )}
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
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">{langTr.signup.step5.title}</h1>
                <p className="text-muted-foreground">
                  {langTr.signup.step5.label}
                </p>
                 <div className="grid grid-cols-2 gap-4 pt-4">
                  {langTr.signup.step5.options.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => form.setValue('lookingFor', option.id, { shouldValidate: true })}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-lg border-2 border-card bg-card p-4 text-center transition-all hover:bg-muted/50",
                        lookingForValue === option.id && "border-primary"
                      )}
                    >
                      <span className="text-4xl">{option.emoji}</span>
                      <p className="font-semibold">{option.label}</p>
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
                'İlerle'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
