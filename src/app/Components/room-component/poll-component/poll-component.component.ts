import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  voters: string[];
}

@Component({
  selector: 'app-poll-component',
  templateUrl: './poll-component.component.html',
  styleUrl: './poll-component.component.scss',
})
export class PollComponentComponent {
  @Input() poll: Poll | null = null;
  @Input() currentUserId: string = '';
  @Output() createPoll = new EventEmitter<{
    question: string;
    options: string[];
  }>();
  @Output() vote = new EventEmitter<string>();

  isCreatingPoll = false;
  newQuestion = '';
  newOptions: string[] = ['', ''];
  errorMessage = '';

  get hasVoted(): boolean {
    return this.poll?.voters.includes(this.currentUserId) || false;
  }

  startCreatingPoll() {
    this.isCreatingPoll = true;
    this.errorMessage = '';
  }

  addOption() {
    this.newOptions.push('');
  }

  removeOption(index: number) {
    if (this.newOptions.length > 2) {
      this.newOptions.splice(index, 1);
    }
  }

  submitPoll() {
    const trimmedQuestion = this.newQuestion.trim();
    const trimmedOptions = this.newOptions.map((opt) => opt.trim());
    if (
      trimmedQuestion &&
      trimmedOptions.length >= 2 &&
      trimmedOptions.every((opt) => opt)
    ) {
      this.createPoll.emit({
        question: trimmedQuestion,
        options: trimmedOptions,
      });
      this.isCreatingPoll = false;
      this.newQuestion = '';
      this.newOptions = ['', ''];
      this.errorMessage = '';
    } else {
      this.errorMessage =
        'Vui lòng điền câu hỏi và ít nhất hai tùy chọn không trống.';
    }
  }

  cancelPollCreation() {
    this.isCreatingPoll = false;
    this.newQuestion = '';
    this.newOptions = ['', ''];
    this.errorMessage = '';
  }

  voteOption(optionId: string) {
    this.vote.emit(optionId);
  }
}
