package shadowshift.studio.imagestorage.model;

/**
 * Класс, содержащий информацию о пользователе
 * Упрощенная альтернатива использованию Spring Security Authentication
 */
public class UserInfo {
    private String username;
    private String role;
    private String userId; 

    public UserInfo() {
    }

    public UserInfo(String username, String role) {
        this.username = username;
        this.role = role;
    }

    public UserInfo(String username, String role, String userId) {
        this.username = username;
        this.role = role;
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}