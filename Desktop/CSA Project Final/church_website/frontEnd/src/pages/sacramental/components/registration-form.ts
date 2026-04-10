/**
 * Choir Registration Form Component
 * Handles registration with validation and submission
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers';
import { Validators } from '../../backend/utils/validators';
import { ChoirApiService } from '../services/choir-api';
import { ChoirRegistration, VoiceType, SkillLevel, RegistrationFormState } from '../../types';

export class RegistrationForm {
  private container: HTMLElement;
  private formState: RegistrationFormState;
  private onSuccess?: (registrationId: string) => void;
  private membershipFee: number;
  private currency: string;
  private checkoutID: string | null = null;

  constructor(
    containerId: string,
    membershipFee: number = 20,
    currency: string = 'Ksh',
    onSuccess?: (registrationId: string) => void
  ) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = element;
    this.membershipFee = membershipFee;
    this.currency = currency;
    this.onSuccess = onSuccess;
    this.formState = {
      data: {},
      errors: [],
      isSubmitting: false
    };
  }

  render(): void {
    this.container.innerHTML = '';
    this.container.className = 'csa-choir-registration';

    const formContainer = DOMHelpers.createElement('div', 'csa-choir-container');
    const card = DOMHelpers.createElement('div', 'csa-choir-card csa-choir-registration__card');

    const title = DOMHelpers.createElement('h2', 'csa-choir-registration__title');
    title.textContent = 'Join Our Choir';

    const subtitle = DOMHelpers.createElement('p', 'csa-choir-registration__subtitle');
    subtitle.textContent = `Membership Fee: ${this.currency} ${this.membershipFee}`;

    const form = this.createForm();

    DOMHelpers.appendChildren(card, [title, subtitle, form]);
    formContainer.appendChild(card);
    this.container.appendChild(formContainer);

    this.attachEventListeners();
  }

  private createForm(): HTMLFormElement {
    const form = DOMHelpers.createElement('form', 'csa-choir-registration__form');
    form.setAttribute('novalidate', 'true');

    form.innerHTML = `
      <div class="csa-choir-form-group">
        <label class="csa-choir-label csa-choir-label--required" for="choir-fullName">Full Name</label>
        <input 
          type="text" 
          id="choir-fullName" 
          name="fullName"
          class="csa-choir-input"
          placeholder="Enter your full name"
          aria-required="true"
        />
        <span class="csa-choir-error-message" role="alert"></span>
      </div>

      <div class="csa-choir-form-group">
        <label class="csa-choir-label csa-choir-label--required" for="choir-registrationNumber">Registration Number / Student ID</label>
        <input 
          type="text" 
          id="choir-registrationNumber" 
          name="registrationNumber"
          class="csa-choir-input"
          placeholder="e.g., CSA/2024/001"
          aria-required="true"
        />
        <span class="csa-choir-error-message" role="alert"></span>
      </div>

      <div class="csa-choir-form-group">
        <label class="csa-choir-label csa-choir-label--required" for="choir-phoneNumber">Phone Number</label>
        <input 
          type="tel" 
          id="choir-phoneNumber" 
          name="phoneNumber"
          class="csa-choir-input"
          placeholder="e.g., 0712345678"
          aria-required="true"
        />
        <span class="csa-choir-error-message" role="alert"></span>
      </div>

      <div class="csa-choir-form-group">
        <label class="csa-choir-label csa-choir-label--required" for="choir-email">Email</label>
        <input 
          type="email" 
          id="choir-email" 
          name="email"
          class="csa-choir-input"
          placeholder="you@example.com"
          aria-required="true"
        />
        <span class="csa-choir-error-message" role="alert"></span>
      </div>

      <div class="csa-choir-form-group">
        <label class="csa-choir-label csa-choir-label--required" for="choir-voiceType">Voice Type</label>
        <select 
          id="choir-voiceType" 
          name="voiceType"
          class="csa-choir-select"
          aria-required="true"
        >
          <option value="">Select your voice type</option>
          <option value="Soprano">Soprano</option>
          <option value="Alto">Alto</option>
          <option value="Tenor">Tenor</option>
          <option value="Bass">Bass</option>
          <option value="Beginner">Beginner / Not Sure</option>
        </select>
        <span class="csa-choir-error-message" role="alert"></span>
      </div>

      <div class="csa-choir-form-group">
        <label class="csa-choir-label csa-choir-label--required" for="choir-skillLevel">Music Skill Level</label>
        <select 
          id="choir-skillLevel" 
          name="skillLevel"
          class="csa-choir-select"
          aria-required="true"
        >
          <option value="">Select your skill level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <span class="csa-choir-error-message" role="alert"></span>
      </div>

      <div class="csa-choir-payment-info">
        <div class="csa-choir-payment-info__header">
          <strong>M-Pesa Payment</strong>
        </div>
        <p class="csa-choir-payment-info__text">
          Registration fee: <strong>${this.currency} ${this.membershipFee}</strong>. 
          When you click submit, you will receive an M-Pesa prompt on your phone. 
          Please enter your PIN to complete the registration.
        </p>
      </div>

      <div class="csa-choir-form-group">
        <div class="csa-choir-checkbox-wrapper">
          <input 
            type="checkbox" 
            id="choir-hasAgreed" 
            name="hasAgreed"
            class="csa-choir-checkbox"
            aria-required="true"
          />
          <label class="csa-choir-label" for="choir-hasAgreed">
            I agree to the choir terms and conditions, and commit to attending regular practices
          </label>
        </div>
        <span class="csa-choir-error-message" role="alert"></span>
      </div>

      <button 
        type="submit" 
        class="csa-choir-btn csa-choir-btn--primary csa-choir-btn--full-width csa-choir-registration__submit"
      >
        Submit Registration
      </button>
    `;

    return form;
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', this.handleSubmit.bind(this));

    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.clearFieldError(input as HTMLInputElement));
    });
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.formState.isSubmitting) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const data: Record<string, unknown> = {
      fullName: formData.get('fullName'),
      registrationNumber: formData.get('registrationNumber'),
      phoneNumber: formData.get('phoneNumber'),
      email: formData.get('email'),
      voiceType: formData.get('voiceType'),
      skillLevel: formData.get('skillLevel'),
      hasAgreed: formData.get('hasAgreed') === 'on'
    };

    const errors = Validators.validateRegistrationForm(data);

    if (errors.length > 0) {
      this.displayErrors(errors);
      return;
    }

    this.clearAllErrors();
    this.setSubmitting(true);

    // --- STEP 1: Initiate M-Pesa Payment ---
    this.setSubmitButtonText('<span class="csa-choir-loading"></span> Requesting M-Pesa Prompt...');
    const paymentResponse = await ChoirApiService.initiateStkPush(data.phoneNumber as string, this.membershipFee);

    if (!paymentResponse.success || !paymentResponse.data) {
      this.setSubmitting(false);
      this.showError(paymentResponse.error || 'Failed to initiate M-Pesa payment. Please check your number.');
      return;
    }

    this.checkoutID = paymentResponse.data.checkoutID;
    this.setSubmitButtonText('<span class="csa-choir-loading"></span> Waiting for PIN...');

    // --- STEP 2: Poll for Payment Status ---
    const isPaid = await this.pollPaymentStatus(this.checkoutID);

    if (!isPaid) {
      this.setSubmitting(false);
      this.showError('Payment was not completed or failed. Please try again.');
      return;
    }

    this.setSubmitButtonText('<span class="csa-choir-loading"></span> Finalizing Registration...');

    // --- STEP 3: Submit Registration ---
    const registration: ChoirRegistration = {
      fullName: data.fullName as string,
      registrationNumber: data.registrationNumber as string,
      phoneNumber: data.phoneNumber as string,
      email: data.email as string,
      voiceType: data.voiceType as VoiceType,
      skillLevel: data.skillLevel as SkillLevel,
      hasAgreed: data.hasAgreed as boolean,
      timestamp: new Date()
    };

    const response = await ChoirApiService.submitRegistration(registration);

    this.setSubmitting(false);

    if (response.success && response.data) {
      this.showSuccess(response.data.registrationId);
      form.reset();
      if (this.onSuccess) {
        this.onSuccess(response.data.registrationId);
      }
    } else {
      this.showError(response.error || 'Failed to submit registration. Please try again.');
    }
  }

  private async pollPaymentStatus(checkoutID: string): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        attempts++;
        const statusResponse = await ChoirApiService.checkPaymentStatus(checkoutID);

        if (statusResponse.success && statusResponse.data) {
          if (statusResponse.data.status === 'Completed') {
            clearInterval(interval);
            resolve(true);
          } else if (statusResponse.data.status === 'Failed') {
            clearInterval(interval);
            resolve(false);
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(false);
        }
      }, 2000);
    });
  }

  private setSubmitButtonText(text: string): void {
    const submitBtn = this.container.querySelector('.csa-choir-registration__submit') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.innerHTML = text;
    }
  }

  private displayErrors(errors: typeof this.formState.errors): void {
    this.clearAllErrors();

    errors.forEach(error => {
      const input = this.container.querySelector(`[name="${error.field}"]`) as HTMLInputElement;
      if (!input) return;

      input.classList.add('csa-choir-input--error', 'csa-choir-select--error');
      const errorSpan = input.parentElement?.querySelector('.csa-choir-error-message');
      if (errorSpan) {
        errorSpan.textContent = error.message;
      }
    });
  }

  private clearFieldError(input: HTMLInputElement): void {
    input.classList.remove('csa-choir-input--error', 'csa-choir-select--error');
    const errorSpan = input.parentElement?.querySelector('.csa-choir-error-message');
    if (errorSpan) {
      errorSpan.textContent = '';
    }
  }

  private clearAllErrors(): void {
    const inputs = this.container.querySelectorAll('.csa-choir-input, .csa-choir-select');
    inputs.forEach(input => {
      input.classList.remove('csa-choir-input--error', 'csa-choir-select--error');
    });

    const errorSpans = this.container.querySelectorAll('.csa-choir-error-message');
    errorSpans.forEach(span => {
      span.textContent = '';
    });

    const existingAlert = this.container.querySelector('.csa-choir-alert');
    if (existingAlert) {
      existingAlert.remove();
    }
  }

  private setSubmitting(isSubmitting: boolean): void {
    this.formState.isSubmitting = isSubmitting;
    const submitBtn = this.container.querySelector('.csa-choir-registration__submit') as HTMLButtonElement;

    if (submitBtn) {
      submitBtn.disabled = isSubmitting;
      submitBtn.innerHTML = isSubmitting
        ? '<span class="csa-choir-loading"></span> Submitting...'
        : 'Submit Registration';
    }
  }

  private showSuccess(registrationId: string): void {
    const alert = DOMHelpers.createElement('div', 'csa-choir-alert csa-choir-alert--success');
    alert.innerHTML = `
      <strong>Registration Successful!</strong><br>
      Your registration ID is: <strong>${registrationId}</strong><br>
      You will receive a confirmation email shortly.
    `;

    const form = this.container.querySelector('form');
    if (form) {
      form.insertAdjacentElement('beforebegin', alert);
      setTimeout(() => alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }

  private showError(message: string): void {
    const alert = DOMHelpers.createElement('div', 'csa-choir-alert csa-choir-alert--error');
    alert.innerHTML = `<strong>Error:</strong> ${message}`;

    const form = this.container.querySelector('form');
    if (form) {
      form.insertAdjacentElement('beforebegin', alert);
      setTimeout(() => alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }

  destroy(): void {
    DOMHelpers.clearElement(this.container);
  }
}
