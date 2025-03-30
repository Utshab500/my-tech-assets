from django.contrib import admin
from django.urls import path
from django import views
from py_project1.views import home,health_check,get_users

urlpatterns = [
    path('admin/', admin.site.urls),

    path('py_project1_home/',home.as_view()),
    path('py_project1_check/',health_check.as_view()),
    path('py_project1_get_users/',get_users.as_view())
]
