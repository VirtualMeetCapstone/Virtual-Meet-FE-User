import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  voterIds: string[];
  createdById: string;
  createdByName: string;
  createdAt: string;
  voterNames?: { [voterId: string]: string };
  voterDisplayNames?: { [userId: string]: string };
}

@Component({
  selector: 'app-poll-component',
  templateUrl: './poll-component.component.html',
  styleUrl: './poll-component.component.scss',
})
export class PollComponentComponent {
  @Input() polls: Poll[] = [];
  @Input() currentUserId: string = '';
  @Output() createPoll = new EventEmitter<{
    question: string;
    options: string[];
  }>();
  @Output() vote = new EventEmitter<string>();
  @Input() userMap: { [userId: string]: string } = {};
  selectedPoll: Poll | null = null;
  isCreatingPoll = false;
  newQuestion = '';
  newOptions: string[] = ['', ''];
  errorMessage = '';
  selectedOption: string | undefined = undefined;

  get hasVoted(): boolean {
    return this.selectedPoll?.voterIds.includes(this.currentUserId) || false;
  }

  ngOnInit() {
    if (this.selectedPoll?.voterNames?.[this.currentUserId]) {
      this.selectedOption = this.selectedPoll.voterNames[this.currentUserId];
    }
  }

  get formattedCreatedAt(): string {
    if (!this.selectedPoll?.createdAt) return '';
    const date = new Date(this.selectedPoll.createdAt);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
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

  selectPoll(poll: Poll) {
    this.selectedPoll = poll;
  }

  voteOnPoll(optionId: string) {
    this.vote.emit(optionId);
    this.selectedOption = optionId;
  }

  getVoterName(voterId: string): string {
    if (!voterId) return 'Unknown';
    if (this.selectedPoll?.voterDisplayNames?.[voterId]) {
      return this.selectedPoll.voterDisplayNames[voterId];
    }
    if (this.userMap[voterId]) {
      return this.userMap[voterId];
    }
    return `User ${voterId.slice(0, 8)}...`;
  }

  trackByIndex(index: number, item: string) {
    return index;
  }
}
