package com.shadowshiftstudio.compressionservice.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@WebFilter("/*")
public class RequestLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        long startTime = System.currentTimeMillis();

        logger.info("Request Info: Method = {}, URI = {}, Remote Addr = {}",
                httpServletRequest.getMethod(),
                httpServletRequest.getRequestURI(),
                httpServletRequest.getRemoteAddr());

        chain.doFilter(request, response);

        long endTime = System.currentTimeMillis();
        logger.info("Response Info: Status = {}, Time Taken = {} ms",
                response.getContentType(),
                endTime - startTime);
    }

    @Override
    public void destroy() {
    }
}
