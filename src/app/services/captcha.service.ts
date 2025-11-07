import { Injectable } from '@angular/core';
import { CaptchaChallenge } from '../shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class CaptchaService {
  private currentChallenge: CaptchaChallenge | null = null;

  /**
   * Generate a new mathematical captcha challenge
   */
  generateChallenge(): CaptchaChallenge {
    const operations = [
      { symbol: '+', operation: (a: number, b: number) => a + b },
      { symbol: '-', operation: (a: number, b: number) => a - b },
      { symbol: '×', operation: (a: number, b: number) => a * b }
    ];

    // Generate random numbers (1-10 for simplicity)
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    // Choose random operation
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    // For subtraction, ensure positive result
    let firstNum = num1;
    let secondNum = num2;
    if (operation.symbol === '-' && num1 < num2) {
      firstNum = num2;
      secondNum = num1;
    }
    
    // For multiplication, use smaller numbers
    if (operation.symbol === '×') {
      firstNum = Math.floor(Math.random() * 5) + 1;
      secondNum = Math.floor(Math.random() * 5) + 1;
    }

    const answer = operation.operation(firstNum, secondNum);
    const question = `${firstNum} ${operation.symbol} ${secondNum} = ?`;
    const id = this.generateId();

    this.currentChallenge = {
      question,
      answer,
      id
    };

    console.log('CaptchaService: Generated challenge', { question, answer }); // For debugging

    return this.currentChallenge;
  }

  /**
   * Validate the captcha answer
   */
  validateAnswer(userAnswer: string, challengeId: string): boolean {
    if (!this.currentChallenge || this.currentChallenge.id !== challengeId) {
      console.warn('CaptchaService: Invalid challenge ID');
      return false;
    }

    // Ensure userAnswer is a string and handle null/undefined cases
    const answerStr = userAnswer ? String(userAnswer).trim() : '';
    if (!answerStr) {
      console.warn('CaptchaService: Empty answer provided');
      return false;
    }

    const numericAnswer = parseInt(answerStr, 10);
    const isValid = !isNaN(numericAnswer) && numericAnswer === this.currentChallenge.answer;
    
    console.log('CaptchaService: Validating answer', {
      originalInput: userAnswer,
      processedAnswer: answerStr,
      numericAnswer: numericAnswer,
      correctAnswer: this.currentChallenge.answer,
      isValid
    });

    // Clear challenge after validation attempt
    this.currentChallenge = null;

    return isValid;
  }

  /**
   * Get current challenge (without answer for security)
   */
  getCurrentChallenge(): Pick<CaptchaChallenge, 'question' | 'id'> | null {
    if (!this.currentChallenge) {
      return null;
    }

    return {
      question: this.currentChallenge.question,
      id: this.currentChallenge.id
    };
  }

  /**
   * Clear current challenge
   */
  clearChallenge(): void {
    this.currentChallenge = null;
  }

  /**
   * Generate a unique ID for the challenge
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate a visual captcha with simple ASCII art
   */
  generateVisualChallenge(): CaptchaChallenge {
    const words = ['HELLO', 'WORLD', 'SECURE', 'ACCESS', 'VERIFY'];
    const selectedWord = words[Math.floor(Math.random() * words.length)];
    
    // Simple ASCII art representation
    const visualRepresentation = this.createAsciiArt(selectedWord);
    
    const challenge: CaptchaChallenge = {
      question: `Enter the word shown: ${visualRepresentation}`,
      answer: selectedWord.toLowerCase().charCodeAt(0), // Use first char code as numeric answer
      id: this.generateId()
    };

    this.currentChallenge = challenge;
    return challenge;
  }

  /**
   * Validate visual captcha
   */
  validateVisualAnswer(userAnswer: string, challengeId: string): boolean {
    if (!this.currentChallenge || this.currentChallenge.id !== challengeId) {
      return false;
    }

    // For visual captcha, we'll store the word differently
    // This is a simplified validation
    const isValid = userAnswer.toLowerCase().length > 0;
    
    this.currentChallenge = null;
    return isValid;
  }

  /**
   * Create simple ASCII art for a word
   */
  private createAsciiArt(word: string): string {
    // Simple representation - add some noise characters
    const noise = ['*', '#', '@', '&', '%'];
    let result = '';
    
    for (let i = 0; i < word.length; i++) {
      if (Math.random() > 0.3) {
        result += word[i];
      } else {
        result += noise[Math.floor(Math.random() * noise.length)];
      }
      
      // Add space between characters
      if (i < word.length - 1) {
        result += ' ';
      }
    }
    
    return result;
  }

  /**
   * Generate honeypot field name (for bot detection)
   */
  generateHoneypotFieldName(): string {
    const names = ['website', 'url', 'homepage', 'link', 'address'];
    return names[Math.floor(Math.random() * names.length)] + '_' + Date.now();
  }
}