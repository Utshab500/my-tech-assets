from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


users=[]


class home(APIView):

    def get(self,request,*args,**kwargs):
        return Response({"message":"ok"},status=200)
    
class health_check(APIView):

    def get(self,request,*args,**kwargs):
        return Response({"message":"health ok"},status=200)

class get_users(APIView):
    
    def get(self,request,*args,**kwargs):
        return Response({"results":[],"message":"user fetched successfully"},status=200)