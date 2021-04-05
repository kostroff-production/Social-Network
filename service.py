from django_filters import rest_framework as filters
from .models import Person

# в данном разделе мы описываем методы применимые к нашим моделям сериализации

# если мы используем выделенный метод гет или пост то он не содержит в себе request,
# поэтому, что бы получить данные отправленные по аякс, нам нужно описать отдельный метод по их получению
def get_q(request):
    q = request.GET.get('q')
    return q

def get_num_tab(request):
    num_tab = request.GET.get('num_tab')
    return num_tab

# данный метод позволит осуществлять поиск модели юзера, через подключаему библеотеку
class PersonFilter(filters.FilterSet):
    first_name = filters.CharFilter(field_name='first_name', lookup_expr='in')
    last_name = filters.CharFilter(field_name='last_name', lookup_expr='in')
    middle_name = filters.CharFilter(field_name='middle_name', lookup_expr='in')

    class Meta:
        model = Person
        fields = ['first_name', 'last_name', 'middle_name']