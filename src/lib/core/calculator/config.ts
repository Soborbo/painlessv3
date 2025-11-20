/**
 * CALCULATOR CONFIGURATION
 *
 * Define calculator steps and flow
 */

import type { Step } from './types';

/**
 * Calculator steps configuration
 *
 * Customize this based on your calculator needs
 */
export const CALCULATOR_STEPS: Step[] = [
  {
    id: 'step-01',
    order: 1,
    title: {
      en: 'Basic Information',
      es: 'Información Básica',
      fr: 'Informations de Base',
    },
    description: {
      en: 'Tell us about your project',
      es: 'Cuéntanos sobre tu proyecto',
      fr: 'Parlez-nous de votre projet',
    },
    component: 'Step01',
  },
  {
    id: 'step-02',
    order: 2,
    title: {
      en: 'Requirements',
      es: 'Requisitos',
      fr: 'Exigences',
    },
    description: {
      en: 'Select your requirements',
      es: 'Selecciona tus requisitos',
      fr: 'Sélectionnez vos exigences',
    },
    component: 'Step02',
  },
  {
    id: 'step-03',
    order: 3,
    title: {
      en: 'Contact Details',
      es: 'Detalles de Contacto',
      fr: 'Coordonnées',
    },
    description: {
      en: 'How can we reach you?',
      es: '¿Cómo podemos contactarte?',
      fr: 'Comment pouvons-nous vous joindre?',
    },
    component: 'Step03',
  },
  {
    id: 'summary',
    order: 4,
    title: {
      en: 'Summary',
      es: 'Resumen',
      fr: 'Résumé',
    },
    description: {
      en: 'Review your quote',
      es: 'Revisa tu cotización',
      fr: 'Vérifiez votre devis',
    },
    component: 'StepSummary',
  },
];

/**
 * Get step by ID
 */
export function getStepById(stepId: string): Step | undefined {
  return CALCULATOR_STEPS.find((step) => step.id === stepId);
}

/**
 * Get step by order
 */
export function getStepByOrder(order: number): Step | undefined {
  return CALCULATOR_STEPS.find((step) => step.order === order);
}

/**
 * Get next step
 */
export function getNextStep(currentStepId: string): Step | null {
  const currentStep = getStepById(currentStepId);
  if (!currentStep) return null;

  return getStepByOrder(currentStep.order + 1) || null;
}

/**
 * Get previous step
 */
export function getPreviousStep(currentStepId: string): Step | null {
  const currentStep = getStepById(currentStepId);
  if (!currentStep) return null;

  return getStepByOrder(currentStep.order - 1) || null;
}

/**
 * Check if step is last
 */
export function isLastStep(stepId: string): boolean {
  const step = getStepById(stepId);
  if (!step) return false;

  return step.order === CALCULATOR_STEPS.length;
}

/**
 * Check if step is first
 */
export function isFirstStep(stepId: string): boolean {
  const step = getStepById(stepId);
  if (!step) return false;

  return step.order === 1;
}

/**
 * Calculate progress
 */
export function calculateProgress(stepId: string): number {
  const step = getStepById(stepId);
  if (!step) return 0;

  return Math.round((step.order / CALCULATOR_STEPS.length) * 100);
}

/**
 * Get total steps
 */
export function getTotalSteps(): number {
  return CALCULATOR_STEPS.length;
}
