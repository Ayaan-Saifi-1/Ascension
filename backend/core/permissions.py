from django.conf import settings
from rest_framework.permissions import BasePermission
class LocalDemoOrAuthenticated(BasePermission):
    def has_permission(self,request,view):
        if settings.DEMO_MODE:
            return True
        if request.user and request.user.is_authenticated:
            return request.method in ("GET","HEAD","OPTIONS") or request.user.groups.filter(name="HSE").exists() or request.user.is_staff
        return False
