# Generated by Django 2.2.6 on 2021-03-03 09:22

from django.db import migrations, models
import project.models


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0011_auto_20210303_1218'),
    ]

    operations = [
        migrations.AlterField(
            model_name='photo',
            name='photo',
            field=models.ImageField(default=1, upload_to=project.models.user_directory_path_photo),
            preserve_default=False,
        ),
    ]