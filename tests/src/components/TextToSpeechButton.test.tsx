// TextToSpeechButton.test.tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import TextToSpeechButton from '../../../src/components/TextToSpeechButton';
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const speakMock = vi.fn();
const cancelMock = vi.fn();
const getVoicesMock = vi.fn().mockReturnValue([
    { lang: 'en-GB', name: 'British Voice' } as SpeechSynthesisVoice,
]);

class MockUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  rate: number = 1;
  pitch: number = 1;
  onend: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.stubGlobal('speechSynthesis', {
    speak: speakMock,
    cancel: cancelMock,
    getVoices: getVoicesMock,
    onvoiceschanged: null,
  });

  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
});

afterEach(() => {
  // Restore all globals to original state
  vi.unstubAllGlobals();
});


describe("TextToSpeechButton", () => {

    it("calls speechSynthesis.speak when button is clicked", () => {
        render(<TextToSpeechButton text="Hello world" />);
        fireEvent.click(screen.getByRole('button'));
        expect(speakMock).toHaveBeenCalledTimes(1);
    });

    it("cancels speech if already speaking", () => {
        render(<TextToSpeechButton text="Hello world" />);
        const button = screen.getByRole('button');

        fireEvent.click(button); 
        fireEvent.click(button); 

        expect(cancelMock).toHaveBeenCalledTimes(1);
    });

    it("changes icon and text while speaking", () => {
        render(<TextToSpeechButton text="Hello world" />);
        const button = screen.getByRole('button');

        expect(screen.getByText('general-read')).toBeInTheDocument();
        fireEvent.click(button);
        expect(screen.getByText('general-stop')).toBeInTheDocument();
    });

    it("uses the British voice if available", () => {
        render(<TextToSpeechButton text="Hello world" />);
        fireEvent.click(screen.getByRole('button'));

        const utteranceArg = speakMock.mock.calls[0][0] as SpeechSynthesisUtterance;
        expect(utteranceArg.voice?.lang).toBe('en-GB');
    });


    it("resets speaking state when utterance ends", async () => {
        render(<TextToSpeechButton text="Hello world" />);
        fireEvent.click(screen.getByRole('button'));

        const utteranceArg = speakMock.mock.calls[0][0] as any;

        act(() => {
            utteranceArg.onend?.();
        });

        expect(await screen.findByText('general-read')).toBeInTheDocument();
    });
});