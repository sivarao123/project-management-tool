package com.taskflow.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Enumeration;

@RestController
public class SocketIoProxyController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${socketio.port:9092}")
    private int targetPort;

    @RequestMapping("/socket.io/**")
    public void proxySocketIo(HttpServletRequest request, HttpServletResponse response) {
        try {
            String path = request.getRequestURI();
            String queryString = request.getQueryString();
            String targetUrl = "http://127.0.0.1:" + targetPort + path + (queryString != null ? "?" + queryString : "");

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(60));

            // Copy request headers excluding restricted hop-by-hop headers
            Enumeration<String> headerNames = request.getHeaderNames();
            if (headerNames != null) {
                while (headerNames.hasMoreElements()) {
                    String headerName = headerNames.nextElement();
                    if (!headerName.equalsIgnoreCase("host") &&
                        !headerName.equalsIgnoreCase("content-length") &&
                        !headerName.equalsIgnoreCase("connection") &&
                        !headerName.equalsIgnoreCase("upgrade")) {
                        String headerVal = request.getHeader(headerName);
                        if (headerVal != null) {
                            try {
                                builder.header(headerName, headerVal);
                            } catch (Exception ignored) {}
                        }
                    }
                }
            }

            // Set method & body
            String method = request.getMethod();
            if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) {
                byte[] bodyBytes = request.getInputStream().readAllBytes();
                builder.method(method, HttpRequest.BodyPublishers.ofByteArray(bodyBytes));
            } else {
                builder.method(method, HttpRequest.BodyPublishers.noBody());
            }

            HttpResponse<InputStream> targetResponse = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofInputStream());

            response.setStatus(targetResponse.statusCode());
            targetResponse.headers().map().forEach((key, values) -> {
                if (!key.equalsIgnoreCase("transfer-encoding") &&
                    !key.equalsIgnoreCase("content-length") &&
                    !key.equalsIgnoreCase("connection")) {
                    for (String v : values) {
                        response.addHeader(key, v);
                    }
                }
            });

            try (InputStream in = targetResponse.body(); OutputStream out = response.getOutputStream()) {
                in.transferTo(out);
                out.flush();
            }
        } catch (Exception ignored) {
            // Handle client disconnect or socket closing gracefully
        }
    }
}
