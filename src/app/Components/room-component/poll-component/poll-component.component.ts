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
  isActive: boolean | null; // Added to track if poll is active or ended
  endedAt?: string; // Added to track when poll was ended
}

export interface PollStatistics {
  totalVotes: number;
  winningOption?: {
    id: string;
    text: string;
    votes: number;
    percentage: number;
  };
  options: {
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }[];
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
  @Output() vote = new EventEmitter<{
    pollId: string;
    optionId: string;
  }>();
  @Output() deletePoll = new EventEmitter<string>(); // Emit pollId to delete
  @Output() endPoll = new EventEmitter<string>(); // Emit pollId to end poll
  @Input() userMap: { [userId: string]: string } = {};
  selectedPoll: Poll | null = null;
  isCreatingPoll = false;
  newQuestion = '';
  newOptions: string[] = ['', ''];
  errorMessage = '';
  selectedOption: string | undefined = undefined;
  pollStatistics: PollStatistics | null = null;
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
    // Make sure we have a selected poll
    if (!this.selectedPoll!.isActive) return;
    if (this.selectedPoll) {
      this.vote.emit({
        pollId: this.selectedPoll.id,
        optionId: optionId
      });
      this.selectedOption = optionId;
    }
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

  deletePollAction() {
    if (this.selectedPoll && confirm('Bạn có chắc chắn muốn xóa cuộc thăm dò này?')) {
      this.deletePoll.emit(this.selectedPoll.id);
      this.selectedPoll = null;
    }
  }

  get isCreator(): boolean {
    return this.selectedPoll?.createdById === this.currentUserId;
  }
  endPollAction() {
    if (this.selectedPoll && this.selectedPoll.isActive &&
        confirm('Bạn có chắc chắn muốn kết thúc cuộc thăm dò này?')) {
      this.endPoll.emit(this.selectedPoll.id);
      this.selectedPoll.isActive = false;
      this.calculateStatistics();
    }
  }

  calculateStatistics() {
    if (!this.selectedPoll) return;

    const totalVotes = this.selectedPoll.options.reduce((sum, option) => sum + option.votes, 0);

    let winningOption = undefined;
    if (totalVotes > 0) {
      winningOption = [...this.selectedPoll.options].sort((a, b) => b.votes - a.votes)[0];
    }

    const optionStats = this.selectedPoll.options.map(option => {
      const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
      return {
        id: option.id,
        text: option.text,
        votes: option.votes,
        percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
      };
    });

    this.pollStatistics = {
      totalVotes,
      options: optionStats,
      winningOption: winningOption ? {
        id: winningOption.id,
        text: winningOption.text,
        votes: winningOption.votes,
        percentage: totalVotes > 0 ? Math.round((winningOption.votes / totalVotes) * 1000) / 10 : 0
      } : undefined
    };
  }

  deselectPoll() {
    this.selectedPoll = null;
    this.pollStatistics = null;
  }

}
