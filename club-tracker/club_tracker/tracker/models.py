from django.db import models
from django.contrib.auth.models import User
class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    deadline = models.DateField()

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    members = models.ManyToManyField(User, related_name='projects')

    is_personal = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    name = models.CharField(max_length=200)
    deadline = models.DateField()

    progress = models.IntegerField(default=0)
    resources = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=[('completed', 'Completed'), ('not_completed', 'Not Completed')],
        default='not_completed'
    )

    def __str__(self):
        return self.name

    def is_completed(self):
        return self.progress == 100

class TaskProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    time_taken = models.FloatField()  # in hours
    notes = models.TextField(blank=True)
    rating = models.IntegerField()

    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.task.name}"