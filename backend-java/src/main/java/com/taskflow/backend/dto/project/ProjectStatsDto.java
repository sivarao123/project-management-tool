package com.taskflow.backend.dto.project;

public class ProjectStatsDto {
    private long total;
    private long completed;
    private long inProgress;
    private long todo;
    private long backlog;
    private long inReview;
    private long overdue;
    private int progress;

    public ProjectStatsDto() {}

    public ProjectStatsDto(long total, long completed, long inProgress, long todo,
                           long backlog, long inReview, long overdue, int progress) {
        this.total = total;
        this.completed = completed;
        this.inProgress = inProgress;
        this.todo = todo;
        this.backlog = backlog;
        this.inReview = inReview;
        this.overdue = overdue;
        this.progress = progress;
    }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public long getCompleted() { return completed; }
    public void setCompleted(long completed) { this.completed = completed; }
    public long getInProgress() { return inProgress; }
    public void setInProgress(long inProgress) { this.inProgress = inProgress; }
    public long getTodo() { return todo; }
    public void setTodo(long todo) { this.todo = todo; }
    public long getBacklog() { return backlog; }
    public void setBacklog(long backlog) { this.backlog = backlog; }
    public long getInReview() { return inReview; }
    public void setInReview(long inReview) { this.inReview = inReview; }
    public long getOverdue() { return overdue; }
    public void setOverdue(long overdue) { this.overdue = overdue; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }
}
