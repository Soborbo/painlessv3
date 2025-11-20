import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('UI Components', () => {
  describe('Button', () => {
    it('should render with default variant', () => {
      const { container } = render(<Button>Click me</Button>);
      expect(container.querySelector('button')).toBeTruthy();
    });

    it('should render with different variants', () => {
      const { container: primary } = render(<Button variant="default">Primary</Button>);
      const { container: secondary } = render(<Button variant="secondary">Secondary</Button>);

      expect(primary.querySelector('button')).toBeTruthy();
      expect(secondary.querySelector('button')).toBeTruthy();
    });

    it('should render with different sizes', () => {
      const { container: sm } = render(<Button size="sm">Small</Button>);
      const { container: lg } = render(<Button size="lg">Large</Button>);

      expect(sm.querySelector('button')).toBeTruthy();
      expect(lg.querySelector('button')).toBeTruthy();
    });
  });

  describe('Input', () => {
    it('should render input field', () => {
      const { container } = render(<Input placeholder="Enter text" />);
      expect(container.querySelector('input')).toBeTruthy();
    });

    it('should render with error state', () => {
      const { container } = render(<Input error placeholder="Error" />);
      expect(container.querySelector('input')).toBeTruthy();
    });
  });

  describe('Card', () => {
    it('should render card with header and content', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>Content here</CardContent>
        </Card>
      );

      expect(container.textContent).toContain('Test Card');
      expect(container.textContent).toContain('Content here');
    });
  });

  describe('Progress', () => {
    it('should render progress bar', () => {
      const { container } = render(<Progress value={50} max={100} />);
      expect(container.querySelector('[role="progressbar"]')).toBeTruthy();
    });

    it('should handle 0% progress', () => {
      const { container } = render(<Progress value={0} max={100} />);
      expect(container.querySelector('div')).toBeTruthy();
    });

    it('should handle 100% progress', () => {
      const { container } = render(<Progress value={100} max={100} />);
      expect(container.querySelector('div')).toBeTruthy();
    });
  });

  describe('Alert', () => {
    it('should render alert with title and description', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>This is a message</AlertDescription>
        </Alert>
      );

      expect(container.textContent).toContain('Important');
      expect(container.textContent).toContain('This is a message');
    });

    it('should render different variants', () => {
      const { container: destructive } = render(<Alert variant="destructive">Error</Alert>);
      const { container: success } = render(<Alert variant="success">Success</Alert>);

      expect(destructive.querySelector('[role="alert"]')).toBeTruthy();
      expect(success.querySelector('[role="alert"]')).toBeTruthy();
    });
  });
});
