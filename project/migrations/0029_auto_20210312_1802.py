# Generated by Django 2.2.6 on 2021-03-12 15:02

from django.db import migrations, models
import project.models


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0028_auto_20210311_1920'),
    ]

    operations = [
        migrations.AddField(
            model_name='video',
            name='poster',
            field=models.ImageField(blank=True, null=True, upload_to=project.models.user_directory_path_video),
        ),
        migrations.AddField(
            model_name='video',
            name='title_video',
            field=models.CharField(blank=True, max_length=250),
        ),
    ]