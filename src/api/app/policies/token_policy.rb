class TokenPolicy < ApplicationPolicy
  def initialize(user, record, opts = {})
    super(user, record, { ensure_logged_in: true }.merge(opts))
  end

  class Scope < Scope
    def initialize(user, scope)
      raise Pundit::NotAuthorizedError, reason: ApplicationPolicy::ANONYMOUS_USER if user.nil? || user.is_nobody?

      super(user, scope)
    end

    def resolve
      # because we cannot use `.or` in scopes that have joins inside
      # see: https://github.com/rails/rails/issues/5545#issuecomment-4632218
      Token.where(id: [scope.owned_tokens(user) + scope.shared_tokens(user) + scope.group_shared_tokens(user)])
    end
  end

  def new?
    true
  end

  def edit?
    update?
  end

  def update?
    create?
  end

  def create?
    record.executor == user
  end

  def destroy?
    create?
  end

  def webui_trigger?
    return false unless user.is_active?

    record.executor == user && !record.type.in?(['Token::Workflow', 'Token::Rss'])
  end

  def show?
    record.executor == user && !record.type.in?(['Token::Rss'])
  end
end
