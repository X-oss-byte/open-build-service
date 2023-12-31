require 'fileutils'

# Create important directories that are needed at runtime
sub_dirs = ['log', 'tmp', 'tmp/cache', 'tmp/pids', 'tmp/sessions', 'tmp/sockets']

sub_dirs.each { |subdir| FileUtils.mkdir_p(Rails.root.join(subdir)) }
