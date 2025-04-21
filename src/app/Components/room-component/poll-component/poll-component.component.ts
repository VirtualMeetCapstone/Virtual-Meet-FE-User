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

  get hasVoted(): boolean {
    return this.poll?.voters.includes(this.currentUserId) || false;
  }

  startCreatingPoll() {
    this.isCreatingPoll = true;
  }

  addOption() {
    this.newOptions.push('');
  }

  submitPoll() {
    if (this.newQuestion && this.newOptions.every((opt) => opt.trim())) {
      this.createPoll.emit({
        question: this.newQuestion,
        options: this.newOptions,
      });
      this.isCreatingPoll = false;
      this.newQuestion = '';
      this.newOptions = ['', ''];
    }
  }

  voteOption(optionId: string) {
    this.vote.emit(optionId);
  }
}
