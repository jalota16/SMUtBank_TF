<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1"%>
<%@ taglib prefix="s" uri="/struts-tags" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>IBS Administrator</title>
</head>
<body>
	<form action="adminUpdate.action">
		<s:iterator value="map" id="item">
			${item.key} : 
			<input type="text" size="60" name="${item.key}" value="${item.value}"/>
			<br>
		</s:iterator>
		<br>
		<br>
		<input type="hidden" name="prop" value=<s:property value="prop"/> />
		<input type="submit" value="Update"/>
	</form>
	<button onclick="window.location.replace('test.jsp');">Return</button>
	
</body>
</html>