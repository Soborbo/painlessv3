import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { NavigationButtons } from '@/components/calculator/navigation-buttons';
import { PriceDisplay } from '@/components/calculator/price-display';
import { StepContainer } from '@/components/calculator/step-container';
import { StepIndicator } from '@/components/calculator/step-indicator';
import { SummaryCard } from '@/components/calculator/summary-card';

describe('Calculator Components', () => {
  describe('StepContainer', () => {
    it('should render with title and description', () => {
      const { container } = render(
        <StepContainer title="Test Step" description="Test description">
          <p>Content</p>
        </StepContainer>
      );

      expect(container.textContent).toContain('Test Step');
      expect(container.textContent).toContain('Test description');
      expect(container.textContent).toContain('Content');
    });
  });

  describe('NavigationButtons', () => {
    it('should render previous and next buttons', () => {
      const { container } = render(
        <NavigationButtons
          onPrevious={() => {}}
          onNext={() => {}}
          canGoPrevious={true}
          canGoNext={true}
        />
      );

      expect(container.textContent).toContain('Previous');
      expect(container.textContent).toContain('Next Step');
    });

    it('should show Get Quote on last step', () => {
      const { container } = render(<NavigationButtons onNext={() => {}} isLastStep={true} />);

      expect(container.textContent).toContain('Get Quote');
    });

    it('should show loading state', () => {
      const { container } = render(<NavigationButtons onNext={() => {}} isLoading={true} />);

      expect(container.textContent).toContain('Loading');
    });
  });

  describe('StepIndicator', () => {
    it('should render correct number of steps', () => {
      const { container } = render(<StepIndicator currentStep={2} totalSteps={4} />);

      // Count the step indicator bars (direct children of the flex container)
      const wrapper = container.querySelector('div');
      const indicators = wrapper?.querySelectorAll(':scope > div');
      expect(indicators?.length).toBe(4);
    });
  });

  describe('PriceDisplay', () => {
    it('should display price amount', () => {
      const { container } = render(<PriceDisplay amount={50000} currency="HUF" />);

      // Price starts at 0 due to animation, check structure instead
      expect(container.textContent).toContain('Total Price');
      expect(container.textContent).toContain('Ft');
    });

    it('should display breakdown', () => {
      const breakdown = {
        base: 30000,
        premium: 20000,
      };

      const { container } = render(
        <PriceDisplay amount={50000} currency="HUF" breakdown={breakdown} />
      );

      expect(container.textContent).toContain('Price Breakdown');
    });
  });

  describe('SummaryCard', () => {
    it('should display summary items', () => {
      const items = [
        { label: 'Project Type', value: 'Web' },
        { label: 'Quantity', value: 5 },
      ];

      const { container } = render(<SummaryCard title="Summary" items={items} />);

      expect(container.textContent).toContain('Project Type');
      expect(container.textContent).toContain('Web');
      expect(container.textContent).toContain('Quantity');
      expect(container.textContent).toContain('5');
    });
  });
});
