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
  @Input() poll: Poll | null = null;
  @Input() currentUserId: string = '';
  @Output() createPoll = new EventEmitter<{
    question: string;
    options: string[];
  }>();
  @Output() vote = new EventEmitter<string>();
  @Input() userMap: { [userId: string]: string } = {};
  isCreatingPoll = false;
  newQuestion = '';
  newOptions: string[] = ['', ''];
  errorMessage = '';
  selectedOption: string | undefined = undefined;
  get hasVoted(): boolean {
    return this.poll?.voterIds.includes(this.currentUserId) || false;
  }

  ngOnInit() {
    if (this.poll?.voterNames?.[this.currentUserId]) {
      this.selectedOption = this.poll.voterNames[this.currentUserId];
    }
  }


  get formattedCreatedAt(): string {
    if (!this.poll?.createdAt) return '';

    const date = new Date(this.poll.createdAt);
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


  voteOnPoll(optionId: string) {

      this.vote.emit(optionId);  // Emit vote change event
      this.selectedOption = optionId;

  }

  getVoterName(voterId: string): string {
    if (!voterId) return 'Unknown';

    // Ưu tiên lấy từ voterDisplayNames mới
    if (this.poll?.voterDisplayNames?.[voterId]) {
      return this.poll.voterDisplayNames[voterId];
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
