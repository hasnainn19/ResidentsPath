/**
 * TextToSpeechButton Component
 *
 * A reusable React component that provides Text-to-Speech (TTS) functionality
 * using the browser's built-in Web Speech API.
 *
 * When clicked, the button reads the provided text aloud to the user.
 *
 * Props:
 * - text (string): The text to be spoken when the button is pressed.
 *
 * Usage example:
 * <TextToSpeechButton text="You are currently in the queue" />
 *
 * Notes:
 * - Put next to text to improve accesibility for various users.
 * - Voice availability may vary depending on browser and OS.
 */


import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import {VolumeUp, Stop} from '@mui/icons-material';


type TextToSpeechButtonProps = {
  text: string;
};

export default function TextToSpeechButton({text}: TextToSpeechButtonProps) {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const speak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        const britishVoice = voices.find(v => v.lang === "en-GB");
        if (britishVoice) utterance.voice = britishVoice;

        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

  return (
    <Button onClick={speak} sx={{display:'inline-flex', ml:1}}>
      {isSpeaking ? <Stop/> : <VolumeUp/>}
      {isSpeaking ? "Stop" : "Read"}
    </Button>
  );
}