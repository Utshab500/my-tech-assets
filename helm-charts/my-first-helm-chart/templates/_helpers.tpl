{{- define "nginx-chart.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "nginx-chart.fullname" -}}
{{- printf "%s-%s" (include "nginx-chart.name" .) .Values.env | trunc 63 | trimSuffix "-" -}}
{{- end -}}
