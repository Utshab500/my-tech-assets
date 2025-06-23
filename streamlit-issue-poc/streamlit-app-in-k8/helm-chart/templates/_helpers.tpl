{{- define "app-chart.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "app-chart.fullname" -}}
{{- printf "%s-%s" (include "app-chart.name" .) .Values.env | trunc 63 | trimSuffix "-" -}}
{{- end -}}
